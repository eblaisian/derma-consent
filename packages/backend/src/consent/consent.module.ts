import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentExplainerService } from './consent-explainer.service';
import { ConsentController } from './consent.controller';
import { ConsentPublicController } from './consent-public.controller';
import { ConsentVerifyController } from './consent-verify.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [ConsentService, ConsentExplainerService],
  controllers: [ConsentController, ConsentPublicController, ConsentVerifyController],
  exports: [ConsentService],
})
export class ConsentModule {}
