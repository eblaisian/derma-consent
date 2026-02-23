import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InviteDto, ChangeRoleDto } from './team.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async listMembers(practiceId: string) {
    return this.prisma.user.findMany({
      where: { practiceId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createInvite(practiceId: string, dto: InviteDto, userId?: string) {
    // Check if user already in practice
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing?.practiceId === practiceId) {
      throw new BadRequestException('Benutzer ist bereits Mitglied dieser Praxis');
    }

    // Check for existing pending invite
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        practiceId,
        email: dto.email,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new BadRequestException('Einladung fuer diese E-Mail existiert bereits');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.prisma.invite.create({
      data: {
        practiceId,
        email: dto.email,
        role: dto.role,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    await this.auditService?.log({
      practiceId,
      userId,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'Invite',
      entityId: invite.id,
      metadata: { email: dto.email, role: dto.role },
    });

    return invite;
  }

  async removeMember(practiceId: string, userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Sie koennen sich nicht selbst entfernen');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, practiceId },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { practiceId: null, role: 'ADMIN' },
    });

    await this.auditService?.log({
      practiceId,
      userId: currentUserId,
      action: 'TEAM_MEMBER_REMOVED',
      entityType: 'User',
      entityId: userId,
      metadata: { removedEmail: user.email },
    });

    return { success: true };
  }

  async changeRole(
    practiceId: string,
    userId: string,
    dto: ChangeRoleDto,
    currentUserId: string,
  ) {
    if (userId === currentUserId) {
      throw new BadRequestException('Sie koennen Ihre eigene Rolle nicht aendern');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, practiceId },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    // Prevent demoting last admin
    if (user.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { practiceId, role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Es muss mindestens einen Administrator geben');
      }
    }

    const oldRole = user.role;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await this.auditService?.log({
      practiceId,
      userId: currentUserId,
      action: 'TEAM_MEMBER_ROLE_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadata: { email: updated.email, oldRole, newRole: dto.role },
    });

    return updated;
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        practice: { select: { id: true, name: true } },
      },
    });

    if (!invite) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Einladung wurde bereits verwendet oder ist abgelaufen');
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Einladung ist abgelaufen');
    }

    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          practiceId: invite.practiceId,
          role: invite.role,
        },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { success: true, practiceId: invite.practiceId };
  }
}
