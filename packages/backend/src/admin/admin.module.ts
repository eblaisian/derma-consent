import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminPracticesController } from './admin-practices.controller';
import { AdminConfigController } from './admin-config.controller';
import { AdminEmailController } from './admin-email.controller';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  providers: [PlatformAdminGuard],
  controllers: [
    AdminDashboardController,
    AdminPracticesController,
    AdminConfigController,
    AdminEmailController,
  ],
})
export class AdminModule {}
