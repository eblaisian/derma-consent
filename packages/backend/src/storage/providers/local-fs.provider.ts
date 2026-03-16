import * as fs from 'fs/promises';
import * as path from 'path';
import type { IStorageProvider, StorageAcl } from '../storage-provider.interface';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.local-storage');

export class LocalFsProvider implements IStorageProvider {
  async upload(options: {
    path: string;
    data: Buffer;
    contentType: string;
    upsert?: boolean;
    acl?: StorageAcl;
  }): Promise<string> {
    const filePath = path.join(LOCAL_STORAGE_DIR, options.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, options.data);
    return options.path;
  }

  async download(options: { path: string }): Promise<Buffer> {
    const filePath = path.join(LOCAL_STORAGE_DIR, options.path);
    return fs.readFile(filePath);
  }

  async remove(options: { paths: string[] }): Promise<void> {
    await Promise.all(
      options.paths.map(async (p) => {
        const filePath = path.join(LOCAL_STORAGE_DIR, p);
        await fs.unlink(filePath).catch(() => {});
      }),
    );
  }

  async getSignedUrl(options: { path: string; expiresInSeconds: number }): Promise<string> {
    return `/api/storage/local/${options.path}`;
  }

  getPublicUrl(options: { path: string }): string {
    return `/api/storage/local/${options.path}`;
  }

  async test(): Promise<{ success: boolean; message: string }> {
    const testData = Buffer.from('dermaconsent-health-check');
    const testPath = `.health-check-${Date.now()}`;
    const testFile = path.join(LOCAL_STORAGE_DIR, testPath);
    try {
      await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
      await fs.writeFile(testFile, testData);
      const downloaded = await fs.readFile(testFile);
      await fs.unlink(testFile);

      if (!downloaded.equals(testData)) {
        return { success: false, message: 'Local storage roundtrip failed: data mismatch' };
      }

      return { success: true, message: `Local filesystem storage healthy (${LOCAL_STORAGE_DIR}, upload/download/delete roundtrip OK)` };
    } catch (err) {
      return { success: false, message: `Local FS error: ${err}` };
    }
  }
}
