import { Global, Module } from '@nestjs/common';
import { UsageMeterService } from './usage-meter.service';
import { UsageAlertService } from './usage-alert.service';

@Global()
@Module({
  providers: [UsageMeterService, UsageAlertService],
  exports: [UsageMeterService, UsageAlertService],
})
export class UsageModule {}
