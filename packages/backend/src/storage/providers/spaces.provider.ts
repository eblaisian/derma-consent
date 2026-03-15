import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageProvider } from '../storage-provider.interface';

interface SpacesConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  cdnEndpoint?: string;
}

export class SpacesProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: SpacesConfig) {
    this.bucket = config.bucket;
    // Virtual-hosted style URL for DO Spaces; CDN endpoint if available
    this.publicBaseUrl = config.cdnEndpoint
      ? config.cdnEndpoint.replace(/\/$/, '')
      : `https://${config.bucket}.${config.region}.digitaloceanspaces.com`;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      // DO Spaces requires virtual-hosted style (bucket.region.digitaloceanspaces.com)
      forcePathStyle: false,
    });
  }

  async upload(options: {
    path: string;
    data: Buffer;
    contentType: string;
    upsert?: boolean;
    acl?: 'private' | 'public-read';
  }): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.path,
        Body: options.data,
        ContentType: options.contentType,
        ACL: options.acl || 'private',
      }),
    );
    return options.path;
  }

  async download(options: { path: string }): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: options.path,
      }),
    );
    const stream = response.Body;
    if (!stream) throw new Error('Empty response from storage');
    return Buffer.from(await stream.transformToByteArray());
  }

  async remove(options: { paths: string[] }): Promise<void> {
    if (options.paths.length === 0) return;
    const response = await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: options.paths.map((key) => ({ Key: key })),
        },
      }),
    );
    if (response.Errors && response.Errors.length > 0) {
      const failed = response.Errors.map((e) => `${e.Key}: ${e.Message}`).join(', ');
      throw new Error(`Storage deletion failed for: ${failed}`);
    }
  }

  async getSignedUrl(options: {
    path: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: options.path,
      }),
      { expiresIn: options.expiresInSeconds },
    );
  }

  getPublicUrl(options: { path: string }): string {
    return `${this.publicBaseUrl}/${options.path}`;
  }

  async test(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket }),
      );
      return { success: true, message: `S3-compatible storage connection successful (bucket: ${this.bucket})` };
    } catch (error) {
      return { success: false, message: `Storage connection failed: ${(error as Error).message}` };
    }
  }
}
