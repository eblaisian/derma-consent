import { Module } from '@nestjs/common';
import { GdtService } from './gdt.service';
import { GdtController } from './gdt.controller';

@Module({
  providers: [GdtService],
  controllers: [GdtController],
  exports: [GdtService],
})
export class GdtModule {}
