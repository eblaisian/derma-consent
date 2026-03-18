'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import { extractDecryptedValue } from '@/lib/decrypt-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CreatePatientDialog } from '@/components/patients/create-patient-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TablePagination } from '@/components/ui/table-pagination';
import { VaultUnlockBanner } from '@/components/vault/vault-unlock-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Eye, UserRound, Lock } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptedNames, setDecryptedNames] = useState<Record<string, string>>({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const decryptedForRef = useRef<string | null>(null);

  const { data: patientsData, isLoading, mutate } = useSWR<PatientsResponse>(
    session?.accessToken ? `${API_URL}/api/patients?page=${page}&limit=${pageSize}` : null,
    createAuthFetcher(session?.accessToken),
  );

  const patientItems = patientsData?.items;

  const handleDecryptAll = useCallback(async () => {
    if (!isUnlocked || !patientItems) return;

    // Avoid re-decrypting the same data
    const dataKey = patientItems.map(p => p.id).join(',');
    if (decryptedForRef.current === dataKey) return;

    setIsDecrypting(true);
    const names: Record<string, string> = {};
    for (const patient of patientItems) {
      try {
        const payload = JSON.parse(patient.encryptedName);
        const decrypted = await decryptForm(payload);
        names[patient.id] = extractDecryptedValue(decrypted);
      } catch {
        names[patient.id] = t('decryptionFailed');
      }
    }
    setDecryptedNames(names);
    decryptedForRef.current = dataKey;
    setIsDecrypting(false);
  }, [isUnlocked, patientItems, decryptForm, t]);

  useEffect(() => {
    if (isUnlocked && patientItems) {
      handleDecryptAll();
    }
    if (!isUnlocked) {
      setDecryptedNames({});
      decryptedForRef.current = null;
    }
  }, [isUnlocked, handleDecryptAll, patientItems]);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed text-pretty">
            {t('description')}
          </p>
        </div>
        <CreatePatientDialog onCreated={() => mutate()} />
      </div>

      <VaultUnlockBanner />

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
              <Search className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('patientList')}</CardTitle>
          <CardDescription>{t('patientCount', { count: patientsData?.total || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('createdAt')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : !patientsData?.items?.length ? (
            <EmptyState
              icon={UserRound}
              title={t('noPatients')}
              description={t('noPatientsDescription')}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientsData.items.map((patient) => (
                    <TableRow key={patient.id} className="cursor-pointer transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">
                        {decryptedNames[patient.id] ? (
                          decryptedNames[patient.id]
                        ) : isDecrypting ? (
                          <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted" />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground italic">
                            <Lock className="size-3 shrink-0" />
                            {t('encrypted')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format.dateTime(new Date(patient.createdAt), { dateStyle: 'medium' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/patients/${patient.id}`}>
                            <Eye className="mr-1 size-4" />
                            {t('details')}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {patientsData.totalPages > 1 && (
                <TablePagination
                  page={page}
                  totalPages={patientsData.totalPages}
                  total={patientsData.total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
