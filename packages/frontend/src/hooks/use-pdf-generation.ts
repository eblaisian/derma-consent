'use client';

import { useState, useCallback } from 'react';
import { useVault } from '@/hooks/use-vault';
import { useAuthFetch } from '@/lib/auth-fetch';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useSession } from 'next-auth/react';
import type { ConsentFormSummary } from '@/lib/types';

interface PdfGenerationState {
  isGenerating: boolean;
  error: string | null;
}

/**
 * Trigger a browser file download from a blob.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function usePdfGeneration() {
  const { isUnlocked, decryptForm, requestUnlock } = useVault();
  const authFetch = useAuthFetch();
  const { data: session } = useSession();
  const [state, setState] = useState<PdfGenerationState>({ isGenerating: false, error: null });

  /**
   * Download an existing PDF by consent ID (streams from backend).
   */
  const downloadPdf = useCallback(
    async (consentId: string): Promise<void> => {
      try {
        const res = await fetch(`${API_URL}/api/consent/${consentId}/pdf`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        if (!res.ok) throw new Error('Download failed');

        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename="(.+)"/)?.[1] || `consent-${consentId}.pdf`;
        downloadBlob(blob, filename);
      } catch {
        // Silently fail — the toast will be shown by the caller if needed
      }
    },
    [session?.accessToken],
  );

  /**
   * Generate a new PDF: decrypt form data client-side, POST to backend, then download the result.
   */
  const generatePdf = useCallback(
    async (consent: ConsentFormSummary): Promise<boolean> => {
      setState({ isGenerating: true, error: null });

      try {
        // 1. Fetch full consent data (encrypted)
        const fetcher = createAuthFetcher(session?.accessToken);
        const consentData = await fetcher(`${API_URL}/api/consent/${consent.token}`);

        // 2. Decrypt form data using vault
        const decrypted = (await decryptForm({
          encryptedSessionKey: consentData.encryptedSessionKey,
          iv: consentData.encryptedResponses.iv,
          ciphertext: consentData.encryptedResponses.ciphertext,
        })) as Record<string, unknown>;

        // 3. POST decrypted data to generate PDF
        await authFetch(`/api/consent/${consent.id}/generate-pdf`, {
          method: 'POST',
          body: JSON.stringify({
            formData: decrypted,
            signatureData: decrypted.signatureData as string | undefined,
            patientName: decrypted.fullName as string | undefined,
            patientDob: decrypted.dateOfBirth as string | undefined,
            locale: consentData.locale || 'de',
          }),
        });

        // 4. Download the generated PDF
        await downloadPdf(consent.id);

        setState({ isGenerating: false, error: null });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'PDF generation failed';
        setState({ isGenerating: false, error: message });
        return false;
      }
    },
    [session?.accessToken, decryptForm, authFetch, downloadPdf],
  );

  /**
   * Generate PDF with vault unlock check.
   * If vault is locked, prompts unlock first, then generates.
   */
  const requestPdfGeneration = useCallback(
    (consent: ConsentFormSummary): Promise<boolean> => {
      if (isUnlocked) {
        return generatePdf(consent);
      }

      return new Promise((resolve) => {
        requestUnlock(() => {
          generatePdf(consent).then(resolve);
        });
      });
    },
    [isUnlocked, generatePdf, requestUnlock],
  );

  return {
    generatePdf: requestPdfGeneration,
    downloadPdf,
    isGenerating: state.isGenerating,
    error: state.error,
  };
}
