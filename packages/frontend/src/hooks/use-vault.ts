'use client';

import { useState, useRef, useCallback } from 'react';
import {
  generateRsaKeyPair,
  exportPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  encryptFormData,
  decryptFormData,
  encryptBlob,
  decryptBlob,
  importPublicKey,
  type EncryptedPrivateKey,
  type EncryptedPayload,
  type EncryptedBlobPayload,
} from '@/lib/crypto';

interface VaultState {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

interface GenerateKeysResult {
  publicKeyJwk: JsonWebKey;
  encryptedPrivateKey: EncryptedPrivateKey;
}

export function useVault() {
  const [state, setState] = useState<VaultState>({
    isUnlocked: false,
    isLoading: false,
    error: null,
  });

  // Store private key in ref to avoid React DevTools exposure
  const privateKeyRef = useRef<CryptoKey | null>(null);

  const generatePracticeKeys = useCallback(
    async (masterPassword: string): Promise<GenerateKeysResult> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const keyPair = await generateRsaKeyPair();
        const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
        const encryptedPrivateKey = await encryptPrivateKey(
          keyPair.privateKey,
          masterPassword,
        );

        return { publicKeyJwk, encryptedPrivateKey };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Key generation failed';
        setState((s) => ({ ...s, error: message }));
        throw err;
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const encryptForPractice = useCallback(
    async (
      formData: unknown,
      publicKeyJwk: JsonWebKey,
    ): Promise<EncryptedPayload> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const publicKey = await importPublicKey(publicKeyJwk);
        return await encryptFormData(formData, publicKey);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Encryption failed';
        setState((s) => ({ ...s, error: message }));
        throw err;
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const unlock = useCallback(
    async (
      encryptedBlob: EncryptedPrivateKey,
      masterPassword: string,
    ): Promise<void> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const privateKey = await decryptPrivateKey(encryptedBlob, masterPassword);
        privateKeyRef.current = privateKey;
        setState({ isUnlocked: true, isLoading: false, error: null });
      } catch {
        setState({
          isUnlocked: false,
          isLoading: false,
          error: 'WRONG_PASSWORD',
        });
        throw new Error('Unlock failed: wrong password or corrupted key data');
      }
    },
    [],
  );

  const decryptForm = useCallback(
    async (payload: EncryptedPayload): Promise<unknown> => {
      if (!privateKeyRef.current) {
        throw new Error('Vault is locked. Call unlock() first.');
      }
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        return await decryptFormData(payload, privateKeyRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Decryption failed';
        setState((s) => ({ ...s, error: message }));
        throw err;
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const encryptPhoto = useCallback(
    async (
      data: ArrayBuffer,
      publicKeyJwk: JsonWebKey,
    ): Promise<EncryptedBlobPayload> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const publicKey = await importPublicKey(publicKeyJwk);
        return await encryptBlob(data, publicKey);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Photo encryption failed';
        setState((s) => ({ ...s, error: message }));
        throw err;
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const decryptPhoto = useCallback(
    async (
      blob: ArrayBuffer,
      iv: string,
      encryptedSessionKey: string,
    ): Promise<ArrayBuffer> => {
      if (!privateKeyRef.current) {
        throw new Error('Vault is locked. Call unlock() first.');
      }
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        return await decryptBlob(blob, iv, encryptedSessionKey, privateKeyRef.current);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Photo decryption failed';
        setState((s) => ({ ...s, error: message }));
        throw err;
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    [],
  );

  const lock = useCallback(() => {
    privateKeyRef.current = null;
    setState({ isUnlocked: false, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    generatePracticeKeys,
    encryptForPractice,
    unlock,
    decryptForm,
    encryptPhoto,
    decryptPhoto,
    lock,
  };
}
