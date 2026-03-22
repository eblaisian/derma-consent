import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { EmailService } from '../email/email.service';
import { UsageMeterService, ResourceType } from './usage-meter.service';
import { UsageResource } from '@prisma/client';
import type { EmailLocale } from '../email/templates/types';

const RESOURCES: ResourceType[] = ['SMS', 'EMAIL', 'AI_EXPLAINER', 'STORAGE_BYTES'];

@Injectable()
export class UsageAlertService {
  private readonly logger = new Logger(UsageAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usageMeter: UsageMeterService,
    private readonly platformConfig: PlatformConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Check all resources for a practice and send alert emails if above threshold.
   * Deduplicates: only sends one alert per resource per period per threshold.
   */
  async checkAndSendAlerts(practiceId: string): Promise<void> {
    const thresholdStr = await this.platformConfig.get('usage.alertThresholdPercent');
    const threshold = parseInt(thresholdStr || '80', 10);

    const periodKey = await this.usageMeter.resolvePeriodKey(practiceId);

    for (const resource of RESOURCES) {
      try {
        const result = await this.usageMeter.isAboveThreshold(practiceId, resource, threshold);

        if (!result.exceeded || result.limit === null) continue;

        // Check if alert already sent for this period + threshold
        const existing = await this.prisma.usageAlert.findUnique({
          where: {
            practiceId_resource_periodKey_threshold: {
              practiceId,
              resource: resource as UsageResource,
              periodKey,
              threshold,
            },
          },
        });

        if (existing) continue;

        // Get practice admins
        const admins = await this.prisma.user.findMany({
          where: { practiceId, role: 'ADMIN' },
          select: { email: true, locale: true },
        });

        if (admins.length === 0) continue;

        // Send alert emails
        for (const admin of admins) {
          try {
            await this.emailService.sendUsageAlert(
              admin.email,
              resource,
              result.percent,
              result.used,
              result.limit,
              (admin.locale || 'de') as EmailLocale,
            );
          } catch (err) {
            this.logger.error(`Failed to send usage alert email to ${admin.email}: ${err}`);
          }
        }

        // Record the alert to prevent duplicates
        await this.prisma.usageAlert.create({
          data: {
            practiceId,
            resource: resource as UsageResource,
            periodKey,
            threshold,
          },
        });

        this.logger.log(
          `Usage alert sent for practice ${practiceId}: ${resource} at ${result.percent}% (${result.used}/${result.limit})`,
        );
      } catch (err) {
        this.logger.error(`Failed to check usage alert for ${practiceId}/${resource}: ${err}`);
      }
    }
  }
}
