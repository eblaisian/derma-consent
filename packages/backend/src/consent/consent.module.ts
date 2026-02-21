import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { ConsentPublicController } from './consent-public.controller';

@Module({
  providers: [ConsentService],
  controllers: [ConsentController, ConsentPublicController],
  exports: [ConsentService],
})
export class ConsentModule {}
