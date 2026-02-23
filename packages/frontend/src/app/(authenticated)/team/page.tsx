'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, UserPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const t = useTranslations('team');
  const tRoles = useTranslations('roles');
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ARZT');
  const [isInviting, setIsInviting] = useState(false);

  const { data: members, isLoading, mutate } = useSWR<TeamMember[]>(
    session?.accessToken ? `${API_URL}/api/team/members` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await authFetch('/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      toast.success(t('inviteSent'));
      setInviteOpen(false);
      setInviteEmail('');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inviteError'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await authFetch(`/api/team/members/${userId}`, { method: 'DELETE' });
      toast.success(t('memberRemoved'));
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('removeError'));
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await authFetch(`/api/team/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      toast.success(t('roleChanged'));
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('roleChangeError'));
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
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('invite')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('inviteTitle')}</DialogTitle>
              <DialogDescription>
                {t('inviteDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('role')}</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{tRoles('ADMIN')}</SelectItem>
                    <SelectItem value="ARZT">{tRoles('ARZT')}</SelectItem>
                    <SelectItem value="EMPFANG">{tRoles('EMPFANG')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                {isInviting ? t('sending') : t('sendInvite')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('members')}</CardTitle>
          <CardDescription>{t('memberCount', { count: members?.length || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('nameColumn')}</TableHead>
                <TableHead>{t('emailColumn')}</TableHead>
                <TableHead>{t('roleColumn')}</TableHead>
                <TableHead className="text-right">{t('actionsColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name || '—'}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    {member.id === session?.user?.id ? (
                      <Badge variant="secondary">{tRoles(member.role as 'ADMIN' | 'ARZT' | 'EMPFANG')}</Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(role) => handleRoleChange(member.id, role)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">{tRoles('ADMIN')}</SelectItem>
                          <SelectItem value="ARZT">{tRoles('ARZT')}</SelectItem>
                          <SelectItem value="EMPFANG">{tRoles('EMPFANG')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== session?.user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
