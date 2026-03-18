'use client';

import {
  createContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
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
  exportKeyForSession,
  importKeyFromSession,
  type EncryptedPrivateKey,
  type EncryptedPayload,
  type EncryptedBlobPayload,
  type SessionWrappedKey,
} from '@/lib/crypto';
import { toast } from 'sonner';

const SESSION_KEY = 'vault-session-key';
const AUTO_LOCK_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 14 * 60 * 1000; // 14 minutes (1 min before lock)
const CHECK_INTERVAL_MS = 10 * 1000; // check every 10 seconds

interface GenerateKeysResult {
  publicKeyJwk: JsonWebKey;
  encryptedPrivateKey: EncryptedPrivateKey;
}

export interface VaultContextValue {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  autoLockRemaining: number | null; // seconds remaining, null if locked
  generatePracticeKeys: (masterPassword: string) => Promise<GenerateKeysResult>;
  encryptForPractice: (formData: unknown, publicKeyJwk: JsonWebKey) => Promise<EncryptedPayload>;
  unlock: (encryptedBlob: EncryptedPrivateKey, masterPassword: string) => Promise<void>;
  decryptForm: (payload: EncryptedPayload) => Promise<unknown>;
  encryptPhoto: (data: ArrayBuffer, publicKeyJwk: JsonWebKey) => Promise<EncryptedBlobPayload>;
  decryptPhoto: (blob: ArrayBuffer, iv: string, encryptedSessionKey: string) => Promise<ArrayBuffer>;
  lock: () => void;
  requestUnlock: (onUnlocked?: () => void) => void;
  closeModal: () => void;
}

export const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoLockRemaining, setAutoLockRemaining] = useState<number | null>(null);

  const privateKeyRef = useRef<CryptoKey | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);
  const sessionRestoredRef = useRef(false);
  const onUnlockedCallbackRef = useRef<(() => void) | null>(null);

  // --- Activity tracking ---
  useEffect(() => {
    if (!isUnlocked) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, updateActivity, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity));
    };
  }, [isUnlocked]);

  // --- Auto-lock check ---
  useEffect(() => {
    if (!isUnlocked) {
      setAutoLockRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((AUTO_LOCK_MS - elapsed) / 1000));
      setAutoLockRemaining(remaining);

      if (elapsed >= AUTO_LOCK_MS) {
        doLock();
        toast.info(
          typeof window !== 'undefined' ? 'Vault auto-locked due to inactivity' : '',
          { id: 'vault-auto-lock' },
        );
      } else if (elapsed >= WARNING_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.warning('Vault will auto-lock in 1 minute', {
          id: 'vault-auto-lock-warning',
          duration: 10000,
        });
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  // --- Session restore on mount ---
  useEffect(() => {
    if (sessionRestoredRef.current) return;
    sessionRestoredRef.current = true;

    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;

    (async () => {
      try {
        const data: SessionWrappedKey = JSON.parse(raw);
        const key = await importKeyFromSession(data);
        privateKeyRef.current = key;
        lastActivityRef.current = Date.now();
        setIsUnlocked(true);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    })();
  }, []);

  // --- Auto-lock on session expiry ---
  useEffect(() => {
    if (!session && privateKeyRef.current) {
      doLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // --- Keyboard shortcut: Ctrl+Shift+L / Cmd+Shift+L ---
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const doLock = useCallback(() => {
    privateKeyRef.current = null;
    sessionStorage.removeItem(SESSION_KEY);
    setIsUnlocked(false);
    setIsLoading(false);
    setError(null);
    setAutoLockRemaining(null);
    warningShownRef.current = false;
  }, []);

  const persistToSession = useCallback(async (key: CryptoKey) => {
    try {
      const data = await exportKeyForSession(key);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
      // Non-critical — vault still works without persistence
    }
  }, []);

  const generatePracticeKeys = useCallback(
    async (masterPassword: string): Promise<GenerateKeysResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const keyPair = await generateRsaKeyPair();
        const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
        const encryptedPrivateKey = await encryptPrivateKey(
          keyPair.privateKey,
          masterPassword,
        );

        // Auto-unlock vault with the freshly generated private key
        privateKeyRef.current = keyPair.privateKey;
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
        setIsUnlocked(true);
        localStorage.setItem('vault-ever-unlocked', 'true');
        await persistToSession(keyPair.privateKey);

        return { publicKeyJwk, encryptedPrivateKey };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Key generation failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [persistToSession],
  );

  const encryptForPractice = useCallback(
    async (formData: unknown, publicKeyJwk: JsonWebKey): Promise<EncryptedPayload> => {
      setIsLoading(true);
      setError(null);
      try {
        const publicKey = await importPublicKey(publicKeyJwk);
        return await encryptFormData(formData, publicKey);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Encryption failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const unlock = useCallback(
    async (encryptedBlob: EncryptedPrivateKey, masterPassword: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const privateKey = await decryptPrivateKey(encryptedBlob, masterPassword);
        privateKeyRef.current = privateKey;
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
        setIsUnlocked(true);
        setIsLoading(false);
        setError(null);
        localStorage.setItem('vault-ever-unlocked', 'true');
        await persistToSession(privateKey);

        // Fire the pending callback (e.g. open a consent viewer)
        const cb = onUnlockedCallbackRef.current;
        onUnlockedCallbackRef.current = null;
        cb?.();
      } catch {
        setIsUnlocked(false);
        setIsLoading(false);
        setError('WRONG_PASSWORD');
        throw new Error('Unlock failed: wrong password or corrupted key data');
      }
    },
    [persistToSession],
  );

  const decryptForm = useCallback(
    async (payload: EncryptedPayload): Promise<unknown> => {
      if (!privateKeyRef.current) {
        throw new Error('Vault is locked. Call unlock() first.');
      }
      setIsLoading(true);
      setError(null);
      try {
        return await decryptFormData(payload, privateKeyRef.current);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Decryption failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const encryptPhoto = useCallback(
    async (data: ArrayBuffer, publicKeyJwk: JsonWebKey): Promise<EncryptedBlobPayload> => {
      setIsLoading(true);
      setError(null);
      try {
        const publicKey = await importPublicKey(publicKeyJwk);
        return await encryptBlob(data, publicKey);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Photo encryption failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
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
      setIsLoading(true);
      setError(null);
      try {
        return await decryptBlob(blob, iv, encryptedSessionKey, privateKeyRef.current);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Photo decryption failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestUnlock = useCallback((onUnlocked?: () => void) => {
    onUnlockedCallbackRef.current = onUnlocked ?? null;
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
    onUnlockedCallbackRef.current = null;
  }, []);

  const value: VaultContextValue = {
    isUnlocked,
    isLoading,
    error,
    isModalOpen,
    autoLockRemaining,
    generatePracticeKeys,
    encryptForPractice,
    unlock,
    decryptForm,
    encryptPhoto,
    decryptPhoto,
    lock: doLock,
    requestUnlock,
    closeModal,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}
