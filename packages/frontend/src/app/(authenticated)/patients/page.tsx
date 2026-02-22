'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import { usePractice } from '@/hooks/use-practice';
import type { EncryptedPrivateKey } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { VaultPanel } from '@/components/dashboard/vault-panel';
import { CreatePatientDialog } from '@/components/patients/create-patient-dialog';
import { toast } from 'sonner';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  encryptedName: string;
  encryptedDob: string | null;
  encryptedEmail: string | null;
  lookupHash: string;
  createdAt: string;
}

interface PatientsResponse {
  items: Patient[];
  total: number;
  page: number;
  totalPages: number;
}

export default function PatientsPage() {
  const t = useTranslations('patients');
  const format = useFormatter();
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const { isUnlocked, decryptForm } = useVault();
  const { practice } = usePractice();
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptedNames, setDecryptedNames] = useState<Record<string, string>>({});

  const { data: patientsData, mutate } = useSWR<PatientsResponse>(
    session?.accessToken ? `${API_URL}/api/patients` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handleDecryptAll = async () => {
    if (!isUnlocked || !patientsData?.items) return;

    const names: Record<string, string> = {};
    for (const patient of patientsData.items) {
      try {
        const decrypted = await decryptForm({
          encryptedSessionKey: '',
          iv: '',
          ciphertext: patient.encryptedName,
        });
        names[patient.id] = typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted);
      } catch {
        names[patient.id] = t('decryptionFailed');
      }
    }
    setDecryptedNames(names);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(searchQuery.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    try {
      const result = await authFetch(`/api/patients/lookup/${hash}`);
      toast.success(t('found', { id: result.id }));
    } catch {
      toast.error(t('notFound'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <CreatePatientDialog onCreated={() => mutate()} />
      </div>

      {!isUnlocked && practice?.encryptedPrivKey && (
        <Card>
          <CardContent className="pt-6">
            <VaultPanel encryptedPrivKey={practice.encryptedPrivKey as unknown as EncryptedPrivateKey} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="sr-only">{t('search')}</Label>
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
            {isUnlocked && (
              <Button variant="outline" onClick={handleDecryptAll}>
                {t('decryptNames')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('patientList')}</CardTitle>
          <CardDescription>{t('patientCount', { count: patientsData?.total || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('createdAt')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientsData?.items.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {decryptedNames[patient.id] || (
                      <span className="text-muted-foreground">{t('encrypted')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format.dateTime(new Date(patient.createdAt), { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/patients/${patient.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        {t('details')}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!patientsData?.items || patientsData.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {t('noPatients')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
