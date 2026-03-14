import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { AiStatusController } from './ai-status.controller';

@Module({
  providers: [CommunicationsService],
  controllers: [CommunicationsController, AiStatusController],
})
export class CommunicationsModule {}
