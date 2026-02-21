import { Module } from '@nestjs/common';
import { TreatmentPlanService } from './treatment-plan.service';
import { TreatmentPlanController } from './treatment-plan.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  providers: [TreatmentPlanService],
  controllers: [TreatmentPlanController],
  exports: [TreatmentPlanService],
})
export class TreatmentPlanModule {}
