import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminPracticesController } from './admin-practices.controller';
import { AdminConfigController } from './admin-config.controller';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';

@Module({
  providers: [PlatformAdminGuard],
  controllers: [
    AdminDashboardController,
    AdminPracticesController,
    AdminConfigController,
  ],
})
export class AdminModule {}
