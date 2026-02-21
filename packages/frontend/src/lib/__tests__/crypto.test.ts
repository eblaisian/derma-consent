import { describe, it, expect } from 'vitest';
import {
  generateRsaKeyPair,
  exportPublicKey,
  importPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  encryptFormData,
  decryptFormData,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../crypto';

describe('crypto', () => {
  describe('Base64 helpers', () => {
    it('should round-trip ArrayBuffer <-> Base64', () => {
      const original = new Uint8Array([0, 1, 127, 128, 255]);
      const b64 = arrayBufferToBase64(original.buffer);
      const restored = new Uint8Array(base64ToArrayBuffer(b64));
      expect(restored).toEqual(original);
    });
  });

  describe('RSA key pair generation', () => {
    it('should generate a 4096-bit RSA-OAEP key pair', async () => {
      const keyPair = await generateRsaKeyPair();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP');
    });

    it('should export public key as JWK', async () => {
      const keyPair = await generateRsaKeyPair();
      const jwk = await exportPublicKey(keyPair.publicKey);
      expect(jwk.kty).toBe('RSA');
      expect(jwk.alg).toBe('RSA-OAEP-256');
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
    });

    it('should import public key from JWK', async () => {
      const keyPair = await generateRsaKeyPair();
      const jwk = await exportPublicKey(keyPair.publicKey);
      const imported = await importPublicKey(jwk);
      expect(imported.algorithm.name).toBe('RSA-OAEP');
    });
  });

  describe('Private key encryption', () => {
    it('should round-trip encrypt/decrypt private key with password', async () => {
      const keyPair = await generateRsaKeyPair();
      const password = 'SuperSicher123!';

      const encrypted = await encryptPrivateKey(keyPair.privateKey, password);
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();

      const decrypted = await decryptPrivateKey(encrypted, password);
      expect(decrypted).toBeDefined();
      expect(decrypted.algorithm.name).toBe('RSA-OAEP');
    });

    it('should reject wrong password', async () => {
      const keyPair = await generateRsaKeyPair();
      const encrypted = await encryptPrivateKey(
        keyPair.privateKey,
        'correct-password',
      );

      await expect(
        decryptPrivateKey(encrypted, 'wrong-password'),
      ).rejects.toThrow();
    });
  });

  describe('Hybrid encryption (form data)', () => {
    it('should round-trip encrypt/decrypt form data', async () => {
      const keyPair = await generateRsaKeyPair();
      const formData = {
        allergies: ['Latex', 'Lidocain'],
        medicalHistory: 'Keine bekannten Vorerkrankungen',
        treatmentAreas: ['Stirn', 'Glabella'],
      };

      const encrypted = await encryptFormData(formData, keyPair.publicKey);
      expect(encrypted.encryptedSessionKey).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();

      const decrypted = await decryptFormData(encrypted, keyPair.privateKey);
      expect(decrypted).toEqual(formData);
    });

    it('should produce unique IVs for each encryption', async () => {
      const keyPair = await generateRsaKeyPair();
      const data = { test: 'data' };

      const enc1 = await encryptFormData(data, keyPair.publicKey);
      const enc2 = await encryptFormData(data, keyPair.publicKey);

      // IVs must differ
      expect(enc1.iv).not.toBe(enc2.iv);
      // Ciphertexts must differ (different session key + different IV)
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
      // Session keys must differ
      expect(enc1.encryptedSessionKey).not.toBe(enc2.encryptedSessionKey);
    });

    it('should handle unicode data (German umlauts)', async () => {
      const keyPair = await generateRsaKeyPair();
      const formData = {
        name: 'Müller-Größe',
        notes: 'Überempfindlichkeit gegenüber Äther',
      };

      const encrypted = await encryptFormData(formData, keyPair.publicKey);
      const decrypted = await decryptFormData(encrypted, keyPair.privateKey);
      expect(decrypted).toEqual(formData);
    });
  });
});
