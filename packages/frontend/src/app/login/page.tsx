import { enabledProviders } from '@/lib/auth';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return <LoginForm enabledProviders={enabledProviders} />;
}

