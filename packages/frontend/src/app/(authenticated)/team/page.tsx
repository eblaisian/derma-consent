'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { getApiErrorMessage } from '@/lib/api-error';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, UserPlus, RefreshCw, X } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function TeamPage() {
  const t = useTranslations('team');
  const tRoles = useTranslations('roles');
  const tErrors = useTranslations('apiErrors');
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ARZT');
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const { data: members, isLoading, mutate } = useSWR<TeamMember[]>(
    session?.accessToken ? `${API_URL}/api/team/members` : null,
    createAuthFetcher(session?.accessToken),
  );

  const { data: pendingInvites, mutate: mutateInvites } = useSWR<PendingInvite[]>(
    session?.accessToken ? `${API_URL}/api/team/invites` : null,
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
      mutateInvites();
    } catch (err) {
      toast.error(getApiErrorMessage(err, tErrors));
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await authFetch(`/api/team/invites/${inviteId}/resend`, { method: 'PATCH' });
      toast.success(t('inviteResent'));
      mutateInvites();
    } catch (err) {
      toast.error(getApiErrorMessage(err, tErrors));
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await authFetch(`/api/team/invites/${inviteId}`, { method: 'DELETE' });
      toast.success(t('inviteRevoked'));
      mutateInvites();
    } catch (err) {
      toast.error(getApiErrorMessage(err, tErrors));
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await authFetch(`/api/team/members/${userId}`, { method: 'DELETE' });
      toast.success(t('memberRemoved'));
      mutate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, tErrors));
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
      toast.error(getApiErrorMessage(err, tErrors));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {t('description')}
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 size-4" />
              {t('invite')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary-subtle">
                <UserPlus className="size-5 text-primary" />
              </div>
              <DialogTitle className="text-center">{t('inviteTitle')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('inviteDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
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

      {/* Pending Invites */}
      {pendingInvites && pendingInvites.length > 0 && (
        <Card className="rounded-xl border border-border/50 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle>{t('pendingInvites')}</CardTitle>
            <CardDescription>{t('pendingInvitesDescription', { count: pendingInvites.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('emailColumn')}</TableHead>
                  <TableHead>{t('roleColumn')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actionsColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tRoles(invite.role as 'ADMIN' | 'ARZT' | 'EMPFANG')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t('pending')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleResendInvite(invite.id)}
                              aria-label={t('resend')}
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('resend')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRevokeInvite(invite.id)}
                              aria-label={t('revokeInvite')}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('revokeInvite')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Members */}
      <Card className="rounded-xl border border-border/50 shadow-[var(--shadow-sm)]">
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
                  <TableCell className="text-right"><Skeleton className="size-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {members?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary-subtle">
                        <UserPlus className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t('members')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('description')}</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img src={member.image} alt="" className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-medium text-primary">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{member.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    {member.id === session?.user?.id ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.role === 'ADMIN'
                          ? 'bg-primary-subtle text-primary'
                          : member.role === 'ARZT'
                            ? 'bg-info-subtle text-info'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {tRoles(member.role as 'ADMIN' | 'ARZT' | 'EMPFANG')}
                      </span>
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setMemberToRemove(member)}
                            aria-label={t('removeMember')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('removeMember')}</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={t('removeConfirmTitle')}
        description={t('removeConfirmDescription', { name: memberToRemove?.name || memberToRemove?.email || '' })}
        confirmLabel={t('removeMember')}
        cancelLabel={t('cancel')}
        onConfirm={() => {
          if (memberToRemove) handleRemove(memberToRemove.id);
          setMemberToRemove(null);
        }}
        variant="destructive"
      />
    </div>
  );
}
