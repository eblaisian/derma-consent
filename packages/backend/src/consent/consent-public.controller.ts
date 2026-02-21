import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { ConsentService } from './consent.service';
import { SubmitConsentDto } from './consent.dto';

@Controller('api/consent')
export class ConsentPublicController {
  constructor(private readonly consentService: ConsentService) {}

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.consentService.findByToken(token);
  }

  @Post(':token/submit')
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
}
