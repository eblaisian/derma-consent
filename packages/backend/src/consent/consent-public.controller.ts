import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ConsentService } from './consent.service';
import { ConsentExplainerService } from './consent-explainer.service';
import { SubmitConsentDto, ExplainConsentDto } from './consent.dto';

@Controller('api/consent')
export class ConsentPublicController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly explainerService: ConsentExplainerService,
  ) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  findByToken(@Param('token') token: string) {
    return this.consentService.findByToken(token);
  }

  @Post(':token/submit')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  submit(
    @Param('token') token: string,
    @Body() dto: SubmitConsentDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';
    return this.consentService.submit(token, dto, ip, userAgent || 'unknown');
  }

  /** GDPR Art. 7(3) — Patient-initiated consent revocation */
  @Post(':token/revoke')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  revokeByPatient(@Param('token') token: string) {
    return this.consentService.revoke(token);
  }

  /** AI Consent Explainer — plain-language explanation for patients */
  @Post(':token/explain')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  explain(
    @Param('token') token: string,
    @Body() dto: ExplainConsentDto,
  ) {
    return this.explainerService.explain(token, dto.locale || 'de');
  }

}
