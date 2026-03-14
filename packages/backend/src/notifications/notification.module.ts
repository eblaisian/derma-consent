import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationLogController } from './notification-log.controller';
import { SmsModule } from '../sms/sms.module';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';

@Global()
@Module({
  imports: [SmsModule],
  providers: [NotificationService, PlatformAdminGuard],
  controllers: [NotificationLogController],
  exports: [NotificationService],
})
export class NotificationModule {}
