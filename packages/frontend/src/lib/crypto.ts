/**
 * Zero-knowledge client-side encryption using Web Crypto API (SubtleCrypto).
 * No external crypto libraries.
 */

const PBKDF2_ITERATIONS = 600_000;
const RSA_KEY_SIZE = 4096;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const SALT_LENGTH = 16;

// --- Base64 Helpers ---

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- Key Derivation ---

async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

// --- RSA Key Pair ---

export async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: RSA_KEY_SIZE,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt'],
  );
}

// --- Private Key Encryption (with master password) ---

export interface EncryptedPrivateKey {
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

export async function encryptPrivateKey(
  privateKey: CryptoKey,
  masterPassword: string,
): Promise<EncryptedPrivateKey> {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const derivedKey = await deriveKeyFromPassword(masterPassword, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    derivedKey,
    exported,
  );

  return {
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

export async function decryptPrivateKey(
  encrypted: EncryptedPrivateKey,
  masterPassword: string,
): Promise<CryptoKey> {
  const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const derivedKey = await deriveKeyFromPassword(masterPassword, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    derivedKey,
    ciphertext,
  );

  return crypto.subtle.importKey(
    'pkcs8',
    decrypted,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
}

// --- Hybrid Encryption (per-form) ---

export interface EncryptedPayload {
  encryptedSessionKey: string; // base64 (RSA-OAEP wrapped AES key)
  iv: string; // base64
  ciphertext: string; // base64 (AES-GCM encrypted data)
}

export async function encryptFormData(
  data: unknown,
  publicKey: CryptoKey,
): Promise<EncryptedPayload> {
  // Generate fresh AES-256-GCM session key
  const sessionKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt'],
  );

  // Export session key raw bytes and wrap with RSA public key
  const rawSessionKey = await crypto.subtle.exportKey('raw', sessionKey);
  const encryptedSessionKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawSessionKey,
  );

  // Encrypt form data with session key
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sessionKey,
    encoded as BufferSource,
  );

  return {
    encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

// --- Blob Encryption (for photos/binary data) ---

export interface EncryptedBlobPayload {
  encryptedSessionKey: string; // base64 (RSA-OAEP wrapped AES key)
  iv: string; // base64
  encryptedBlob: ArrayBuffer;
}

export async function encryptBlob(
  data: ArrayBuffer,
  publicKey: CryptoKey,
): Promise<EncryptedBlobPayload> {
  // Generate fresh AES-256-GCM session key
  const sessionKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt'],
  );

  // Export session key raw bytes and wrap with RSA public key
  const rawSessionKey = await crypto.subtle.exportKey('raw', sessionKey);
  const encryptedSessionKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawSessionKey,
  );

  // Encrypt blob data with session key
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sessionKey,
    data,
  );

  return {
    encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    encryptedBlob: ciphertext,
  };
}

export async function decryptBlob(
  encryptedBlob: ArrayBuffer,
  iv: string,
  encryptedSessionKey: string,
  privateKey: CryptoKey,
): Promise<ArrayBuffer> {
  // Unwrap session key with RSA private key
  const rawSessionKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(encryptedSessionKey),
  );

  // Import session key
  const sessionKey = await crypto.subtle.importKey(
    'raw',
    rawSessionKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['decrypt'],
  );

  // Decrypt blob data
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    sessionKey,
    encryptedBlob,
  );
}

export async function decryptFormData(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
): Promise<unknown> {
  // Unwrap session key with RSA private key
  const rawSessionKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(payload.encryptedSessionKey),
  );

  // Import session key
  const sessionKey = await crypto.subtle.importKey(
    'raw',
    rawSessionKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['decrypt'],
  );

  // Decrypt form data
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    sessionKey,
    base64ToArrayBuffer(payload.ciphertext),
  );

  const text = new TextDecoder().decode(decrypted);
  return JSON.parse(text);
}
