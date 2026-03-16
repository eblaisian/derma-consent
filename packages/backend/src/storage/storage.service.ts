import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import type { IStorageProvider, StorageAcl } from './storage-provider.interface';
import { SpacesProvider } from './providers/spaces.provider';
import { LocalFsProvider } from './providers/local-fs.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: IStorageProvider | null = null;
  private lastInitAttempt = 0;

  constructor(private readonly platformConfig: PlatformConfigService) {}

  private async getProvider(): Promise<IStorageProvider> {
    if (this.provider && Date.now() - this.lastInitAttempt < 60_000) {
      return this.provider;
    }

    const endpoint = await this.platformConfig.get('storage.endpoint');
    const accessKey = await this.platformConfig.get('storage.accessKey');
    const secretKey = await this.platformConfig.get('storage.secretKey');
    const region = (await this.platformConfig.get('storage.region')) || 'fra1';
    const bucket = (await this.platformConfig.get('storage.bucket')) || 'derma-consent-bucket';
    const cdnEndpoint = await this.platformConfig.get('storage.cdnEndpoint');

    this.lastInitAttempt = Date.now();

    if (endpoint && accessKey && secretKey) {
      this.provider = new SpacesProvider({ endpoint, region, accessKey, secretKey, bucket, cdnEndpoint });
    } else {
      this.logger.warn('S3 storage not configured — using local filesystem fallback');
      this.provider = new LocalFsProvider();
    }

    return this.provider;
  }

  invalidate(): void {
    this.provider = null;
    this.lastInitAttempt = 0;
  }

  async upload(path: string, data: Buffer, contentType: string, options?: { upsert?: boolean; acl?: StorageAcl }): Promise<string> {
    const provider = await this.getProvider();
    return provider.upload({ path, data, contentType, upsert: options?.upsert, acl: options?.acl });
  }

  async download(path: string): Promise<Buffer> {
    const provider = await this.getProvider();
    return provider.download({ path });
  }

  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const provider = await this.getProvider();
    await provider.remove({ paths });
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const provider = await this.getProvider();
    return provider.getSignedUrl({ path, expiresInSeconds });
  }

  async getPublicUrl(path: string): Promise<string | null> {
    const provider = await this.getProvider();
    return provider.getPublicUrl({ path });
  }

  async test(): Promise<{ success: boolean; message: string }> {
    const provider = await this.getProvider();
    return provider.test();
  }
}
