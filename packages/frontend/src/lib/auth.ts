import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Only register providers whose credentials are actually configured
const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraId({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    }),
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}

providers.push(
  Credentials({
    credentials: {
      email: {},
      password: {},
      tempToken: {},
      twoFactorCode: {},
    },
    async authorize(credentials) {
      // 2FA verification flow — called after initial login returned requires2FA
      if (credentials.tempToken && credentials.twoFactorCode) {
        const res = await fetch(`${API_URL}/api/auth/2fa/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tempToken: credentials.tempToken,
            token: credentials.twoFactorCode,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          image: data.user.image,
          accessToken: data.accessToken,
          practiceId: data.user.practiceId,
          role: data.user.role,
        };
      }

      // Standard login flow
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();

      // If email is not verified, throw a special error that the login form can catch
      if (data.emailNotVerified) {
        throw new Error(`EMAIL_NOT_VERIFIED:${data.email}`);
      }

      // If 2FA is required, throw a special error that the login form can catch
      if (data.requires2FA) {
        throw new Error(`2FA_REQUIRED:${data.tempToken}`);
      }

      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
        accessToken: data.accessToken,
        practiceId: data.user.practiceId,
        role: data.user.role,
      };
    },
  }),
);

/** Which provider IDs are enabled — used by the login page */
export const enabledProviders = {
  google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  'microsoft-entra-id': !!(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET),
  apple: !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  credentials: true,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, user, profile, trigger, session: updateData }) {
      if (trigger === 'update' && updateData) {
        // Session update from client — merge in new data (e.g. practiceId after setup)
        if (updateData.practiceId !== undefined) {
          token.practiceId = updateData.practiceId;
        }
        if (updateData.role !== undefined) {
          token.role = updateData.role;
        }
      } else if (account?.provider === 'credentials' && user) {
        // Credentials login — backend JWT comes from authorize()
        token.accessToken = (user as Record<string, unknown>).accessToken as string;
        token.userId = user.id;
        token.practiceId = (user as Record<string, unknown>).practiceId as string | null;
        token.role = (user as Record<string, unknown>).role as string;
      } else if (account && profile) {
        // OAuth login — sync with backend to get a backend JWT
        try {
          const res = await fetch(`${API_URL}/api/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Secret': process.env.AUTH_SECRET!,
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              image: (profile as Record<string, unknown>).picture || (profile as Record<string, unknown>).avatar_url,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.accessToken;
            token.userId = data.user.id;
            token.practiceId = data.user.practiceId;
            token.role = data.user.role;
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.userId as string;
      session.user.practiceId = token.practiceId as string | null;
      session.user.role = token.role as string;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
