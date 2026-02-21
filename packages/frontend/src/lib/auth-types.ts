import 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      practiceId: string | null;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT extends DefaultJWT {
    accessToken?: string;
    userId?: string;
    practiceId?: string | null;
    role?: string;
  }
}
