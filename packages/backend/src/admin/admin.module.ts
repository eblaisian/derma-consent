import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminPracticesController } from './admin-practices.controller';
import { AdminConfigController } from './admin-config.controller';

@Module({
  controllers: [
    AdminDashboardController,
    AdminPracticesController,
    AdminConfigController,
  ],
})
export class AdminModule {}
