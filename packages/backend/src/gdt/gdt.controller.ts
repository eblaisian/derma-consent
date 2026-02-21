import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GdtService } from './gdt.service';
import { ConsentResultOptions } from './gdt.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/gdt')
@UseGuards(JwtAuthGuard)
export class GdtController {
  constructor(private readonly gdtService: GdtService) {}

  @Post('generate')
  generate(@Body() body: ConsentResultOptions, @Res() res: Response) {
    const buffer = this.gdtService.generateConsentResultRecord(body);

    res.status(HttpStatus.OK);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="consent_${body.patientId}.gdt"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
