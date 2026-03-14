import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { AiStatusController } from './ai-status.controller';

@Module({
  imports: [SmsModule],
  providers: [CommunicationsService],
  controllers: [CommunicationsController, AiStatusController],
})
export class CommunicationsModule {}
