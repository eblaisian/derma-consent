import { describe, it, expect } from 'vitest';
import {
  generateRsaKeyPair,
  exportPublicKey,
  importPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  encryptFormData,
  decryptFormData,
} from '../crypto';

describe('Vault crypto operations', () => {
  const masterPassword = 'TestMasterPassword123!';

  it('should generate RSA keypair and encrypt private key', async () => {
    const keyPair = await generateRsaKeyPair();
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
    const encryptedPrivKey = await encryptPrivateKey(
      keyPair.privateKey,
      masterPassword,
    );

    expect(publicKeyJwk).toBeDefined();
    expect(publicKeyJwk.kty).toBe('RSA');
    expect(encryptedPrivKey).toBeDefined();
    expect(encryptedPrivKey.ciphertext).toBeTruthy();
    expect(encryptedPrivKey.salt).toBeTruthy();
    expect(encryptedPrivKey.iv).toBeTruthy();
  });

  it('should unlock (decrypt) private key with correct password', async () => {
    const keyPair = await generateRsaKeyPair();
    const encryptedPrivKey = await encryptPrivateKey(
      keyPair.privateKey,
      masterPassword,
    );

    const decryptedKey = await decryptPrivateKey(
      encryptedPrivKey,
      masterPassword,
    );

    expect(decryptedKey).toBeDefined();
    expect(decryptedKey.type).toBe('private');
  });

  it('should fail to unlock with wrong password', async () => {
    const keyPair = await generateRsaKeyPair();
    const encryptedPrivKey = await encryptPrivateKey(
      keyPair.privateKey,
      masterPassword,
    );

    await expect(
      decryptPrivateKey(encryptedPrivKey, 'WrongPassword'),
    ).rejects.toThrow();
  });

  it('should round-trip encrypt and decrypt form data', async () => {
    const keyPair = await generateRsaKeyPair();
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
    const publicKey = await importPublicKey(publicKeyJwk);

    const formData = {
      name: 'Max Mustermann',
      dob: '1990-01-15',
      answers: { q1: 'yes', q2: 'no' },
    };

    const encrypted = await encryptFormData(formData, publicKey);
    expect(encrypted.encryptedData).toBeTruthy();
    expect(encrypted.encryptedSessionKey).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();

    const decrypted = await decryptFormData(encrypted, keyPair.privateKey);
    expect(decrypted).toEqual(formData);
  });
});
