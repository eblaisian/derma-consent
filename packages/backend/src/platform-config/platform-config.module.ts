import { Global, Module } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';
import { FeatureFlagsController } from './feature-flags.controller';

@Global()
@Module({
  providers: [PlatformConfigService],
  controllers: [FeatureFlagsController],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
