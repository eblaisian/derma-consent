import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogParams {
  practiceId?: string;
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        practiceId: params.practiceId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as object | undefined,
        ipAddress: params.ipAddress,
      },
    });
  }

  async findByPractice(
    practiceId: string,
    options: {
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { action, startDate, endDate, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { practiceId };

    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportCsv(
    practiceId: string,
    options: { startDate?: Date; endDate?: Date; locale?: string } = {},
  ) {
    const { startDate, endDate, locale = 'de' } = options;
    const maxRows = 10000;

    const where: Record<string, unknown> = { practiceId };
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: maxRows,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const headers: Record<string, string> = {
      de: 'Zeitstempel,Aktion,Benutzer,E-Mail,Entitaet,IP-Adresse',
      en: 'Timestamp,Action,User,Email,Entity,IP Address',
      es: 'Marca de tiempo,Accion,Usuario,Correo,Entidad,Direccion IP',
      fr: 'Horodatage,Action,Utilisateur,E-mail,Entite,Adresse IP',
    };

    const header = (headers[locale] || headers.de) + '\n';
    const rows = logs.map((log) =>
      [
        log.createdAt.toISOString(),
        log.action,
        log.user?.name || '',
        log.user?.email || '',
        log.entityType ? `${log.entityType}:${log.entityId}` : '',
        log.ipAddress || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );

    return header + rows.join('\n');
  }
}
