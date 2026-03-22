import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ConfigService } from '@nestjs/config';
import { InviteDto, ChangeRoleDto } from './team.dto';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { ErrorCode, errorPayload } from '../common/error-codes';

const PLAN_TEAM_LIMIT_KEY: Record<SubscriptionPlan, string> = {
  FREE_TRIAL: 'team.freeTrialLimit',
  STARTER: 'team.starterLimit',
  PROFESSIONAL: 'team.professionalLimit',
  ENTERPRISE: 'team.enterpriseLimit',
};

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly platformConfig: PlatformConfigService,
    private readonly configService: ConfigService,
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
    // Enforce team member limit per plan
    await this.enforceTeamMemberLimit(practiceId);

    // Check if user already in practice
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing?.practiceId === practiceId) {
      throw new BadRequestException(errorPayload(ErrorCode.USER_ALREADY_MEMBER));
    }

    // Check for existing invites
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        practiceId,
        email: dto.email,
        status: { in: ['PENDING', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingInvite?.status === 'PENDING') {
      throw new BadRequestException(errorPayload(ErrorCode.INVITE_ALREADY_PENDING));
    }

    // Expired invites don't block re-inviting — a new invite is created below

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

    // Send invite email
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
      select: { name: true },
    });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite/${invite.token}`;

    this.notificationService.sendTeamInvite({
      practiceId,
      recipientEmail: dto.email,
      practiceName: practice?.name || 'Praxis',
      role: dto.role,
      inviteLink,
      userId,
    }).catch(() => {}); // Fire-and-forget; audit already logged the invite creation

    return invite;
  }

  async removeMember(practiceId: string, userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException(errorPayload(ErrorCode.CANNOT_REMOVE_SELF));
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, practiceId },
    });

    if (!user) {
      throw new NotFoundException(errorPayload(ErrorCode.USER_NOT_FOUND));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { practiceId: null, role: 'EMPFANG' },
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
      throw new BadRequestException(errorPayload(ErrorCode.CANNOT_CHANGE_OWN_ROLE));
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, practiceId },
    });

    if (!user) {
      throw new NotFoundException(errorPayload(ErrorCode.USER_NOT_FOUND));
    }

    // Prevent demoting last admin
    if (user.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { practiceId, role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(errorPayload(ErrorCode.LAST_ADMIN_CANNOT_CHANGE));
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
      throw new NotFoundException(errorPayload(ErrorCode.INVITE_NOT_FOUND));
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(errorPayload(ErrorCode.INVITE_ALREADY_USED_OR_EXPIRED));
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException(errorPayload(ErrorCode.INVITE_EXPIRED));
    }

    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    // Verify the accepting user's email matches the invite email
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, practiceId: true },
    });

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(errorPayload(ErrorCode.INVITE_EMAIL_MISMATCH));
    }

    // If user already belongs to the invited practice, just mark invite as accepted
    if (user.practiceId === invite.practiceId) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
      return { success: true, practiceId: invite.practiceId };
    }

    // Prevent overwriting membership in a different practice
    if (user.practiceId) {
      throw new BadRequestException(errorPayload(ErrorCode.USER_ALREADY_IN_OTHER_PRACTICE));
    }

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

  async listPendingInvites(practiceId: string) {
    return this.prisma.invite.findMany({
      where: { practiceId, status: 'PENDING' },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resendInvite(practiceId: string, inviteId: string, userId?: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, practiceId, status: 'PENDING' },
    });

    if (!invite) {
      throw new NotFoundException(errorPayload(ErrorCode.INVITE_NOT_FOUND));
    }

    // Reset expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { expiresAt },
    });

    // Resend email
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
      select: { name: true },
    });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite/${invite.token}`;

    this.notificationService.sendTeamInvite({
      practiceId,
      recipientEmail: invite.email,
      practiceName: practice?.name || 'Praxis',
      role: invite.role,
      inviteLink,
      userId,
    }).catch(() => {});

    await this.auditService?.log({
      practiceId,
      userId,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'Invite',
      entityId: invite.id,
      metadata: { email: invite.email, role: invite.role, resend: true },
    });

    return { success: true };
  }

  private async enforceTeamMemberLimit(practiceId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
      select: { plan: true },
    });

    const plan = subscription?.plan ?? 'FREE_TRIAL';
    const limitKey = PLAN_TEAM_LIMIT_KEY[plan];
    const limitValue = parseInt((await this.platformConfig.get(limitKey)) || '-1', 10);

    if (limitValue <= 0) return; // -1 = unlimited

    // Count current members + pending invites
    const [memberCount, pendingInviteCount] = await Promise.all([
      this.prisma.user.count({ where: { practiceId } }),
      this.prisma.invite.count({ where: { practiceId, status: 'PENDING' } }),
    ]);

    if (memberCount + pendingInviteCount >= limitValue) {
      throw new ForbiddenException(
        errorPayload(
          ErrorCode.TEAM_MEMBER_LIMIT_REACHED,
          `Team member limit (${limitValue}) reached for ${plan} plan`,
        ),
      );
    }
  }

  async revokeInvite(practiceId: string, inviteId: string, userId?: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, practiceId, status: 'PENDING' },
    });

    if (!invite) {
      throw new NotFoundException(errorPayload(ErrorCode.INVITE_NOT_FOUND));
    }

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });

    await this.auditService?.log({
      practiceId,
      userId,
      action: 'TEAM_MEMBER_REMOVED',
      entityType: 'Invite',
      entityId: invite.id,
      metadata: { email: invite.email, revoked: true },
    });

    return { success: true };
  }
}
