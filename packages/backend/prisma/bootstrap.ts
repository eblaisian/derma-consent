/**
 * Bootstrap script: ensures a platform admin account always exists.
 *
 * Idempotent — safe to run on every deployment:
 * - If no PLATFORM_ADMIN user exists → creates one
 * - If one exists but email differs from PLATFORM_ADMIN_EMAIL → updates email
 * - If one exists with correct email → no-op
 *
 * Env vars:
 *   PLATFORM_ADMIN_EMAIL    (default: admin@derma-consent.de)
 *   PLATFORM_ADMIN_PASSWORD (default: auto-generated, printed to stdout)
 *   DATABASE_URL            (required)
 *
 * Run: npx tsx prisma/bootstrap.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const BCRYPT_ROUNDS = 12;

async function bootstrap() {
  const prisma = new PrismaClient();

  try {
    const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@derma-consent.de';

    console.log(`[bootstrap] Ensuring platform admin exists: ${adminEmail}`);

    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.PLATFORM_ADMIN },
    });

    if (existingAdmin) {
      if (existingAdmin.email === adminEmail) {
        console.log(`[bootstrap] Platform admin already exists: ${adminEmail} — no changes`);
        return;
      }

      // Email changed — update it
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { email: adminEmail },
      });
      console.log(`[bootstrap] Updated platform admin email: ${existingAdmin.email} → ${adminEmail}`);
      return;
    }

    // No admin exists — create one
    const password = process.env.PLATFORM_ADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Platform Admin',
        role: UserRole.PLATFORM_ADMIN,
        passwordHash,
        emailVerified: true,
        practiceId: null,
      },
    });

    console.log(`[bootstrap] Created platform admin: ${adminEmail}`);

    if (!process.env.PLATFORM_ADMIN_PASSWORD) {
      console.log(`[bootstrap] Generated password: ${password}`);
      console.log(`[bootstrap] ⚠ Save this password — it will not be shown again. Change it after first login.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap().catch((err) => {
  console.error('[bootstrap] Failed:', err);
  process.exit(1);
});
