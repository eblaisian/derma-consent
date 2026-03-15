import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import type { IStorageProvider, StorageAcl } from './storage-provider.interface';
import { SpacesProvider } from './providers/spaces.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: IStorageProvider | null = null;
  private lastInitAttempt = 0;

  constructor(private readonly platformConfig: PlatformConfigService) {}

  private async getProvider(): Promise<IStorageProvider | null> {
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
      return this.provider;
    }

    this.provider = null;
    return null;
  }

  invalidate(): void {
    this.provider = null;
    this.lastInitAttempt = 0;
  }

  async upload(path: string, data: Buffer, contentType: string, options?: { upsert?: boolean; acl?: StorageAcl }): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) {
      this.logger.warn(`[DEV-FALLBACK] Returning data URI for ${path} — storage is not configured`);
      return `data:${contentType};base64,${data.toString('base64')}`;
    }
    return provider.upload({ path, data, contentType, upsert: options?.upsert, acl: options?.acl });
  }

  async download(path: string): Promise<Buffer> {
    if (path.startsWith('data:')) {
      const base64 = path.split(',')[1];
      return Buffer.from(base64, 'base64');
    }
    const provider = await this.getProvider();
    if (!provider) throw new Error('Storage is not configured');
    return provider.download({ path });
  }

  async remove(paths: string[]): Promise<void> {
    const realPaths = paths.filter((p) => !p.startsWith('data:'));
    if (realPaths.length === 0) return;
    const provider = await this.getProvider();
    if (!provider) {
      this.logger.error(`Storage not configured — cannot delete files: ${realPaths.join(', ')}`);
      throw new Error('Storage is not configured — cannot guarantee file erasure');
    }
    await provider.remove({ paths: realPaths });
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('Storage is not configured');
    return provider.getSignedUrl({ path, expiresInSeconds });
  }

  async getPublicUrl(path: string): Promise<string | null> {
    const provider = await this.getProvider();
    if (!provider) return null;
    return provider.getPublicUrl({ path });
  }

  async test(): Promise<{ success: boolean; message: string }> {
    const provider = await this.getProvider();
    if (!provider) {
      return { success: false, message: 'Storage not configured (set endpoint, access key, and secret key)' };
    }
    return provider.test();
  }
}
