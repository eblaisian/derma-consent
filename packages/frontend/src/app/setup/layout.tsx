import { VaultProvider } from '@/contexts/vault-context';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}
