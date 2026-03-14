import { VaultProvider } from '@/contexts/vault-context';

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}
