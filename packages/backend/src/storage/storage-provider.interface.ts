export type StorageAcl = 'private' | 'public-read';

export interface IStorageProvider {
  upload(options: {
    path: string;
    data: Buffer;
    contentType: string;
    upsert?: boolean;
    acl?: StorageAcl;
  }): Promise<string>;

  download(options: { path: string }): Promise<Buffer>;

  remove(options: { paths: string[] }): Promise<void>;

  getSignedUrl(options: {
    path: string;
    expiresInSeconds: number;
  }): Promise<string>;

  getPublicUrl(options: { path: string }): string;

  test(): Promise<{ success: boolean; message: string }>;
}
