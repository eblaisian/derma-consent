/**
 * Comprehensive seed script: 2-year production simulation
 *
 * Creates 2 practices, 6 users, 10 patients, ~20 consent forms,
 * treatment templates/plans/photos, audit logs, and subscriptions.
 *
 * Master Password (all practices): Test1234!
 * User Password (all accounts):    Test1234!
 *
 * Run: npx tsx prisma/seed.ts
 */

import {
  PrismaClient,
  ConsentStatus,
  ConsentType,
  UserRole,
  AuditAction,
  BodyRegion,
  PhotoType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Crypto constants (mirror frontend crypto.ts) ──

const PBKDF2_ITERATIONS = 600_000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

// ── Crypto helpers ──

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

async function encryptPrivateKey(
  privateKey: CryptoKey,
  masterPassword: string,
) {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const derivedKey = await deriveKeyFromPassword(masterPassword, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    exported,
  );
  return {
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

async function encryptFormData(data: unknown, publicKey: CryptoKey) {
  const sessionKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt'],
  );
  const rawSessionKey = await crypto.subtle.exportKey('raw', sessionKey);
  const encryptedSessionKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawSessionKey,
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sessionKey,
    encoded,
  );
  return {
    encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    ciphertext: arrayBufferToBase64(ciphertext),
  };
}

async function encryptString(value: string, publicKey: CryptoKey) {
  const result = await encryptFormData(value, publicKey);
  return JSON.stringify(result);
}

async function hashLookup(name: string, dob: string): Promise<string> {
  const data = new TextEncoder().encode(`${name.toLowerCase()}|${dob}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hash);
}

// ── Constants ──

const MASTER_PASSWORD = 'Test1234!';
const USER_PASSWORD = 'Test1234!';
const BCRYPT_ROUNDS = 10;

const PRACTICE_1_ID = 'seed-practice-001';
const PRACTICE_2_ID = 'seed-practice-002';

// 1x1 transparent PNG as base64 — used as placeholder for treatment photos
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ── Date helpers ──

const NOW = new Date();

/** Returns a Date offset by the given number of days from now (negative = past). */
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

// ── Patient data ──

interface PatientSeed {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  email: string;
  practiceIdx: number; // 0 or 1
  createdDaysAgo: number;
}

const PATIENTS: PatientSeed[] = [
  // Practice 1 — Dr. Mueller (6 patients)
  { firstName: 'Anna', lastName: 'Weber', dob: '1985-03-15', email: 'anna.weber@example.de', practiceIdx: 0, createdDaysAgo: 700 },
  { firstName: 'Thomas', lastName: 'Fischer', dob: '1978-11-22', email: 'thomas.fischer@example.de', practiceIdx: 0, createdDaysAgo: 600 },
  { firstName: 'Maria', lastName: 'Hoffmann', dob: '1990-07-08', email: 'maria.hoffmann@example.de', practiceIdx: 0, createdDaysAgo: 450 },
  { firstName: 'Stefan', lastName: 'Becker', dob: '1972-01-30', email: 'stefan.becker@example.de', practiceIdx: 0, createdDaysAgo: 300 },
  { firstName: 'Julia', lastName: 'Schulz', dob: '1995-09-12', email: 'julia.schulz@example.de', practiceIdx: 0, createdDaysAgo: 150 },
  { firstName: 'Klaus', lastName: 'Richter', dob: '1968-05-25', email: 'klaus.richter@example.de', practiceIdx: 0, createdDaysAgo: 30 },
  // Practice 2 — Dr. Schmidt (4 patients)
  { firstName: 'Sabine', lastName: 'Klein', dob: '1982-04-18', email: 'sabine.klein@example.de', practiceIdx: 1, createdDaysAgo: 500 },
  { firstName: 'Michael', lastName: 'Wolf', dob: '1975-12-03', email: 'michael.wolf@example.de', practiceIdx: 1, createdDaysAgo: 350 },
  { firstName: 'Laura', lastName: 'Braun', dob: '1993-06-27', email: 'laura.braun@example.de', practiceIdx: 1, createdDaysAgo: 200 },
  { firstName: 'Peter', lastName: 'Neumann', dob: '1960-08-14', email: 'peter.neumann@example.de', practiceIdx: 1, createdDaysAgo: 60 },
];

// ── Form data samples ──

const FORM_DATA_SAMPLES: Record<string, unknown> = {
  BOTOX: {
    treatmentAreas: ['Stirn (Frontalis)', 'Glabella (Zornesfalte)'],
    allergies: 'Keine bekannt',
    medications: 'Ibuprofen bei Bedarf',
    medicalHistory: 'Keine relevanten Vorerkrankungen',
    pregnant: false,
    bloodThinners: false,
    previousBotox: 'Erste Behandlung',
  },
  FILLER: {
    treatmentAreas: ['Lippen', 'Nasolabialfalte'],
    fillerType: 'Hyaluronsaeure',
    allergies: 'Penicillin',
    medications: 'Keine',
    medicalHistory: 'Leichte Neurodermitis',
    pregnant: false,
    bloodThinners: false,
  },
  LASER: {
    treatmentAreas: ['Gesicht', 'Hals'],
    skinType: 'Typ II',
    allergies: 'Keine bekannt',
    medications: 'Vitamin D',
    medicalHistory: 'Keine',
    pregnant: false,
    bloodThinners: false,
    recentSunExposure: false,
  },
  CHEMICAL_PEEL: {
    treatmentAreas: ['Gesicht'],
    peelType: 'Glykolsaeure 30%',
    allergies: 'Keine bekannt',
    medications: 'Keine',
    medicalHistory: 'Keine',
    pregnant: false,
    bloodThinners: false,
    recentRetinolUse: false,
  },
  MICRONEEDLING: {
    treatmentAreas: ['Gesicht', 'Dekollete'],
    needleDepth: '1.0mm',
    allergies: 'Keine bekannt',
    medications: 'Keine',
    medicalHistory: 'Keine',
    pregnant: false,
    bloodThinners: false,
    activeAcne: false,
  },
  PRP: {
    treatmentAreas: ['Kopfhaut', 'Gesicht'],
    allergies: 'Keine bekannt',
    medications: 'Keine',
    medicalHistory: 'Keine',
    pregnant: false,
    bloodThinners: false,
    recentBloodDrawIssues: false,
  },
};

// ── Treatment template data ──

const TEMPLATE_DATA = [
  {
    name: 'Botox Stirn (Forehead)',
    type: ConsentType.BOTOX,
    bodyRegion: BodyRegion.FOREHEAD,
    templateData: {
      product: 'Botulinum Toxin Typ A',
      defaultUnits: 20,
      injectionPoints: [
        { x: 30, y: 20, units: 4, label: 'Frontalis Links' },
        { x: 50, y: 15, units: 4, label: 'Frontalis Mitte' },
        { x: 70, y: 20, units: 4, label: 'Frontalis Rechts' },
        { x: 40, y: 25, units: 4, label: 'Frontalis Links-Mitte' },
        { x: 60, y: 25, units: 4, label: 'Frontalis Rechts-Mitte' },
      ],
    },
  },
  {
    name: 'Botox Glabella',
    type: ConsentType.BOTOX,
    bodyRegion: BodyRegion.GLABELLA,
    templateData: {
      product: 'Botulinum Toxin Typ A',
      defaultUnits: 20,
      injectionPoints: [
        { x: 50, y: 30, units: 8, label: 'Procerus' },
        { x: 35, y: 25, units: 6, label: 'Corrugator Links' },
        { x: 65, y: 25, units: 6, label: 'Corrugator Rechts' },
      ],
    },
  },
  {
    name: 'Filler Lippen (Lips)',
    type: ConsentType.FILLER,
    bodyRegion: BodyRegion.LIPS,
    templateData: {
      product: 'Hyaluronsaeure 1ml',
      defaultVolume: '1.0ml',
      injectionPoints: [
        { x: 40, y: 50, volume: '0.25ml', label: 'Oberlippe Links' },
        { x: 60, y: 50, volume: '0.25ml', label: 'Oberlippe Rechts' },
        { x: 40, y: 55, volume: '0.25ml', label: 'Unterlippe Links' },
        { x: 60, y: 55, volume: '0.25ml', label: 'Unterlippe Rechts' },
      ],
    },
  },
  {
    name: 'Filler Nasolabial',
    type: ConsentType.FILLER,
    bodyRegion: BodyRegion.NASOLABIAL,
    templateData: {
      product: 'Hyaluronsaeure 1ml',
      defaultVolume: '1.0ml',
      injectionPoints: [
        { x: 35, y: 45, volume: '0.3ml', label: 'Nasolabial Links Oben' },
        { x: 35, y: 55, volume: '0.2ml', label: 'Nasolabial Links Unten' },
        { x: 65, y: 45, volume: '0.3ml', label: 'Nasolabial Rechts Oben' },
      ],
    },
  },
];

// ── Treatment plan data ──

const TREATMENT_PLAN_SAMPLES = [
  {
    type: ConsentType.BOTOX,
    data: {
      product: 'Botulinum Toxin Typ A',
      totalUnits: 40,
      areas: [
        { region: 'Stirn', units: 20 },
        { region: 'Glabella', units: 20 },
      ],
      notes: 'Erstbehandlung, konservative Dosierung',
    },
  },
  {
    type: ConsentType.FILLER,
    data: {
      product: 'Hyaluronsaeure',
      totalVolume: '1.5ml',
      areas: [
        { region: 'Lippen', volume: '1.0ml' },
        { region: 'Nasolabial', volume: '0.5ml' },
      ],
      notes: 'Auffrischung nach 6 Monaten',
    },
  },
  {
    type: ConsentType.LASER,
    data: {
      device: 'Fraktionierter CO2 Laser',
      settings: { power: '15W', density: '300 MTZ/cm2', passes: 2 },
      areas: ['Gesicht komplett'],
      notes: 'Aknenarben-Behandlung, Sitzung 2 von 3',
    },
  },
  {
    type: ConsentType.MICRONEEDLING,
    data: {
      device: 'Dermapen 4',
      needleDepth: '1.5mm',
      serum: 'Hyaluronsaeure + Vitamin C',
      areas: ['Gesicht', 'Hals'],
      notes: 'Kollagenstimulation',
    },
  },
];

// ── Main seed ──

async function main() {
  console.log('=== Comprehensive Seed: 2-Year Production Simulation ===\n');

  // ── Step 1: Generate crypto keys for both practices ──
  console.log('Generating RSA-4096 key pairs (this takes a moment)...');
  const [keyPair1, keyPair2] = await Promise.all([
    generateRsaKeyPair(),
    generateRsaKeyPair(),
  ]);

  const pubKey1Jwk = await crypto.subtle.exportKey('jwk', keyPair1.publicKey);
  const pubKey2Jwk = await crypto.subtle.exportKey('jwk', keyPair2.publicKey);

  console.log('Encrypting private keys with master password...');
  const [encPrivKey1, encPrivKey2] = await Promise.all([
    encryptPrivateKey(keyPair1.privateKey, MASTER_PASSWORD),
    encryptPrivateKey(keyPair2.privateKey, MASTER_PASSWORD),
  ]);

  // ── Step 2: Hash user password ──
  console.log('Hashing user password...');
  const passwordHash = await bcrypt.hash(USER_PASSWORD, BCRYPT_ROUNDS);

  // ── Step 3: Clean existing seed data (respect FK order) ──
  console.log('Cleaning existing seed data...');
  const practiceIds = [PRACTICE_1_ID, PRACTICE_2_ID];
  const where = { where: { practiceId: { in: practiceIds } } };

  await prisma.treatmentPhoto.deleteMany(where);
  await prisma.treatmentPlan.deleteMany(where);
  await prisma.treatmentTemplate.deleteMany(where);
  await prisma.consentForm.deleteMany(where);
  await prisma.patient.deleteMany(where);
  await prisma.auditLog.deleteMany(where);
  await prisma.subscription.deleteMany(where);
  await prisma.practiceSettings.deleteMany(where);
  await prisma.account.deleteMany({
    where: { user: { practiceId: { in: practiceIds } } },
  });
  await prisma.user.deleteMany({ where: { practiceId: { in: practiceIds } } });
  await prisma.invite.deleteMany(where);
  await prisma.practice.deleteMany({ where: { id: { in: practiceIds } } });

  // ── Step 4: Create practices ──
  console.log('Creating practices...');
  const practice1 = await prisma.practice.create({
    data: {
      id: PRACTICE_1_ID,
      name: 'Dermatologie Praxis Dr. Mueller',
      dsgvoContact: 'datenschutz@praxis-mueller.de',
      publicKey: pubKey1Jwk as object,
      encryptedPrivKey: encPrivKey1 as object,
      gdtSenderId: 'PRAXMUELLER',
      createdAt: daysAgo(730),
    },
  });

  const practice2 = await prisma.practice.create({
    data: {
      id: PRACTICE_2_ID,
      name: 'Hautklinik Dr. Schmidt',
      dsgvoContact: 'datenschutz@hautklinik-schmidt.de',
      publicKey: pubKey2Jwk as object,
      encryptedPrivKey: encPrivKey2 as object,
      gdtSenderId: 'HAUTKSCHMIDT',
      createdAt: daysAgo(500),
    },
  });

  const practices = [practice1, practice2];
  const publicKeys = [keyPair1.publicKey, keyPair2.publicKey];

  // ── Step 5: Create users ──
  console.log('Creating users...');
  interface UserSeed {
    email: string;
    name: string;
    role: UserRole;
    practiceIdx: number;
    createdDaysAgo: number;
  }

  const USER_DEFS: UserSeed[] = [
    { email: 'admin@praxis-mueller.de', name: 'Admin Mueller', role: UserRole.ADMIN, practiceIdx: 0, createdDaysAgo: 730 },
    { email: 'dr.mueller@praxis-mueller.de', name: 'Dr. Hans Mueller', role: UserRole.ARZT, practiceIdx: 0, createdDaysAgo: 730 },
    { email: 'empfang@praxis-mueller.de', name: 'Lisa Berger', role: UserRole.EMPFANG, practiceIdx: 0, createdDaysAgo: 700 },
    { email: 'admin@hautklinik-schmidt.de', name: 'Admin Schmidt', role: UserRole.ADMIN, practiceIdx: 1, createdDaysAgo: 500 },
    { email: 'dr.schmidt@hautklinik-schmidt.de', name: 'Dr. Eva Schmidt', role: UserRole.ARZT, practiceIdx: 1, createdDaysAgo: 500 },
    { email: 'empfang@hautklinik-schmidt.de', name: 'Max Bauer', role: UserRole.EMPFANG, practiceIdx: 1, createdDaysAgo: 480 },
  ];

  const users: { id: string; email: string; practiceIdx: number; role: UserRole }[] = [];
  for (const u of USER_DEFS) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        practiceId: practices[u.practiceIdx].id,
        createdAt: daysAgo(u.createdDaysAgo),
      },
    });
    users.push({ id: user.id, email: u.email, practiceIdx: u.practiceIdx, role: u.role });
  }

  // ── Step 6: Create subscriptions ──
  console.log('Creating subscriptions...');
  await prisma.subscription.create({
    data: {
      practiceId: PRACTICE_1_ID,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_seed_mueller_001',
      stripeSubscriptionId: 'sub_seed_mueller_001',
      currentPeriodEnd: daysFromNow(30),
      createdAt: daysAgo(365),
    },
  });

  await prisma.subscription.create({
    data: {
      practiceId: PRACTICE_2_ID,
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_seed_schmidt_001',
      stripeSubscriptionId: 'sub_seed_schmidt_001',
      currentPeriodEnd: daysFromNow(15),
      createdAt: daysAgo(200),
    },
  });

  // ── Step 7: Create practice settings ──
  console.log('Creating practice settings...');
  await prisma.practiceSettings.create({
    data: {
      practiceId: PRACTICE_1_ID,
      brandColor: '#2563EB',
      defaultConsentExpiry: 7,
      enabledConsentTypes: JSON.parse(
        '["BOTOX","FILLER","LASER","CHEMICAL_PEEL","MICRONEEDLING","PRP"]',
      ),
      createdAt: daysAgo(730),
    },
  });

  await prisma.practiceSettings.create({
    data: {
      practiceId: PRACTICE_2_ID,
      brandColor: '#059669',
      defaultConsentExpiry: 14,
      enabledConsentTypes: JSON.parse(
        '["BOTOX","FILLER","LASER","MICRONEEDLING"]',
      ),
      createdAt: daysAgo(500),
    },
  });

  // ── Step 8: Create patients ──
  console.log('Creating patients...');
  const patientIds: string[] = [];

  for (const p of PATIENTS) {
    const practiceId = practices[p.practiceIdx].id;
    const pubKey = publicKeys[p.practiceIdx];
    const fullName = `${p.firstName} ${p.lastName}`;

    const [encName, encDob, encEmail, lookup] = await Promise.all([
      encryptString(fullName, pubKey),
      encryptString(p.dob, pubKey),
      encryptString(p.email, pubKey),
      hashLookup(fullName, p.dob),
    ]);

    const patient = await prisma.patient.create({
      data: {
        practiceId,
        encryptedName: encName,
        encryptedDob: encDob,
        encryptedEmail: encEmail,
        lookupHash: lookup,
        createdAt: daysAgo(p.createdDaysAgo),
      },
    });
    patientIds.push(patient.id);
  }

  // ── Step 9: Create consent forms ──
  console.log('Creating consent forms...');

  interface ConsentSeed {
    patientIdx: number;
    practiceIdx: number;
    type: ConsentType;
    status: ConsentStatus;
    token: string;
    createdDaysAgo: number;
    signed: boolean;
  }

  const CONSENT_DEFS: ConsentSeed[] = [
    // Practice 1 — Dr. Mueller
    { patientIdx: 0, practiceIdx: 0, type: ConsentType.BOTOX, status: ConsentStatus.COMPLETED, token: 'seed-token-m01-botox', createdDaysAgo: 680, signed: true },
    { patientIdx: 0, practiceIdx: 0, type: ConsentType.FILLER, status: ConsentStatus.COMPLETED, token: 'seed-token-m02-filler', createdDaysAgo: 400, signed: true },
    { patientIdx: 0, practiceIdx: 0, type: ConsentType.BOTOX, status: ConsentStatus.SIGNED, token: 'seed-token-m03-botox2', createdDaysAgo: 10, signed: true },
    { patientIdx: 1, practiceIdx: 0, type: ConsentType.LASER, status: ConsentStatus.COMPLETED, token: 'seed-token-m04-laser', createdDaysAgo: 550, signed: true },
    { patientIdx: 1, practiceIdx: 0, type: ConsentType.MICRONEEDLING, status: ConsentStatus.REVOKED, token: 'seed-token-m05-micro', createdDaysAgo: 300, signed: true },
    { patientIdx: 2, practiceIdx: 0, type: ConsentType.CHEMICAL_PEEL, status: ConsentStatus.COMPLETED, token: 'seed-token-m06-peel', createdDaysAgo: 420, signed: true },
    { patientIdx: 2, practiceIdx: 0, type: ConsentType.PRP, status: ConsentStatus.SIGNED, token: 'seed-token-m07-prp', createdDaysAgo: 100, signed: true },
    { patientIdx: 3, practiceIdx: 0, type: ConsentType.BOTOX, status: ConsentStatus.COMPLETED, token: 'seed-token-m08-botox', createdDaysAgo: 280, signed: true },
    { patientIdx: 4, practiceIdx: 0, type: ConsentType.FILLER, status: ConsentStatus.PENDING, token: 'seed-token-m09-filler', createdDaysAgo: 5, signed: false },
    { patientIdx: 4, practiceIdx: 0, type: ConsentType.LASER, status: ConsentStatus.PENDING, token: 'seed-token-m10-laser', createdDaysAgo: 3, signed: false },
    { patientIdx: 5, practiceIdx: 0, type: ConsentType.BOTOX, status: ConsentStatus.PENDING, token: 'seed-token-m11-botox', createdDaysAgo: 1, signed: false },
    // Practice 1 — expired form
    { patientIdx: 3, practiceIdx: 0, type: ConsentType.PRP, status: ConsentStatus.EXPIRED, token: 'seed-token-m12-expired', createdDaysAgo: 200, signed: false },

    // Practice 2 — Dr. Schmidt
    { patientIdx: 6, practiceIdx: 1, type: ConsentType.BOTOX, status: ConsentStatus.COMPLETED, token: 'seed-token-s01-botox', createdDaysAgo: 480, signed: true },
    { patientIdx: 6, practiceIdx: 1, type: ConsentType.FILLER, status: ConsentStatus.SIGNED, token: 'seed-token-s02-filler', createdDaysAgo: 200, signed: true },
    { patientIdx: 7, practiceIdx: 1, type: ConsentType.LASER, status: ConsentStatus.COMPLETED, token: 'seed-token-s03-laser', createdDaysAgo: 330, signed: true },
    { patientIdx: 7, practiceIdx: 1, type: ConsentType.MICRONEEDLING, status: ConsentStatus.COMPLETED, token: 'seed-token-s04-micro', createdDaysAgo: 150, signed: true },
    { patientIdx: 8, practiceIdx: 1, type: ConsentType.BOTOX, status: ConsentStatus.PENDING, token: 'seed-token-s05-botox', createdDaysAgo: 2, signed: false },
    { patientIdx: 8, practiceIdx: 1, type: ConsentType.FILLER, status: ConsentStatus.REVOKED, token: 'seed-token-s06-filler', createdDaysAgo: 180, signed: true },
    { patientIdx: 9, practiceIdx: 1, type: ConsentType.CHEMICAL_PEEL, status: ConsentStatus.PENDING, token: 'seed-token-s07-peel', createdDaysAgo: 1, signed: false },
    { patientIdx: 9, practiceIdx: 1, type: ConsentType.LASER, status: ConsentStatus.EXPIRED, token: 'seed-token-s08-expired', createdDaysAgo: 50, signed: false },
  ];

  const consentFormIds: string[] = [];
  const ips = ['192.168.1.42', '10.0.0.5', '172.16.0.12', '192.168.0.100', '10.0.1.33', '172.16.1.7'];
  const agents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Linux; Android 14)',
    'Mozilla/5.0 (iPad; CPU OS 17_0)',
  ];

  for (let i = 0; i < CONSENT_DEFS.length; i++) {
    const c = CONSENT_DEFS[i];
    const practiceId = practices[c.practiceIdx].id;
    const pubKey = publicKeys[c.practiceIdx];
    const formDataKey = c.type as string;
    const formData = FORM_DATA_SAMPLES[formDataKey] || FORM_DATA_SAMPLES.BOTOX;
    const createdAt = daysAgo(c.createdDaysAgo);

    let encryptedResponses: object | undefined;
    let encryptedSessionKey: string | undefined;
    let signatureIp: string | undefined;
    let signatureTimestamp: Date | undefined;
    let signatureUserAgent: string | undefined;
    let revokedAt: Date | undefined;

    if (c.signed) {
      const enc = await encryptFormData(formData, pubKey);
      encryptedResponses = { iv: enc.iv, ciphertext: enc.ciphertext };
      encryptedSessionKey = enc.encryptedSessionKey;
      signatureIp = ips[i % ips.length];
      signatureTimestamp = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
      signatureUserAgent = agents[i % agents.length];
    }

    if (c.status === ConsentStatus.REVOKED) {
      revokedAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const isExpired = c.status === ConsentStatus.EXPIRED;
    const expiresAt = isExpired
      ? daysAgo(c.createdDaysAgo - 7) // expired 7 days after creation, but still in the past
      : daysFromNow(7);

    const stripeSessionId =
      c.status === ConsentStatus.COMPLETED
        ? `cs_test_seed_${c.token}`
        : undefined;
    const stripePaymentIntent =
      c.status === ConsentStatus.COMPLETED
        ? `pi_test_seed_${c.token}`
        : undefined;

    const form = await prisma.consentForm.create({
      data: {
        practiceId,
        patientId: patientIds[c.patientIdx],
        type: c.type,
        status: c.status,
        token: c.token,
        encryptedResponses: encryptedResponses ?? undefined,
        encryptedSessionKey,
        signatureIp,
        signatureTimestamp,
        signatureUserAgent,
        stripeSessionId,
        stripePaymentIntent,
        expiresAt,
        revokedAt,
        createdAt,
      },
    });
    consentFormIds.push(form.id);
  }

  // ── Step 10: Create treatment templates ──
  console.log('Creating treatment templates...');
  const templateIds: { practiceIdx: number; id: string; type: ConsentType }[] = [];

  for (let pIdx = 0; pIdx < 2; pIdx++) {
    for (const t of TEMPLATE_DATA) {
      const template = await prisma.treatmentTemplate.create({
        data: {
          practiceId: practices[pIdx].id,
          name: t.name,
          type: t.type,
          bodyRegion: t.bodyRegion,
          templateData: t.templateData as object,
          createdAt: daysAgo(pIdx === 0 ? 700 : 480),
        },
      });
      templateIds.push({ practiceIdx: pIdx, id: template.id, type: t.type });
    }
  }

  // ── Step 11: Create treatment plans ──
  console.log('Creating treatment plans...');

  interface PlanSeed {
    patientIdx: number;
    practiceIdx: number;
    consentIdx: number; // index into CONSENT_DEFS
    sampleIdx: number; // index into TREATMENT_PLAN_SAMPLES
    performed: boolean;
    createdDaysAgo: number;
  }

  const PLAN_DEFS: PlanSeed[] = [
    { patientIdx: 0, practiceIdx: 0, consentIdx: 0, sampleIdx: 0, performed: true, createdDaysAgo: 678 },
    { patientIdx: 0, practiceIdx: 0, consentIdx: 1, sampleIdx: 1, performed: true, createdDaysAgo: 398 },
    { patientIdx: 1, practiceIdx: 0, consentIdx: 3, sampleIdx: 2, performed: true, createdDaysAgo: 548 },
    { patientIdx: 2, practiceIdx: 0, consentIdx: 5, sampleIdx: 0, performed: true, createdDaysAgo: 418 },
    { patientIdx: 3, practiceIdx: 0, consentIdx: 7, sampleIdx: 0, performed: true, createdDaysAgo: 278 },
    { patientIdx: 6, practiceIdx: 1, consentIdx: 12, sampleIdx: 0, performed: true, createdDaysAgo: 478 },
    { patientIdx: 7, practiceIdx: 1, consentIdx: 14, sampleIdx: 2, performed: true, createdDaysAgo: 328 },
    { patientIdx: 7, practiceIdx: 1, consentIdx: 15, sampleIdx: 3, performed: false, createdDaysAgo: 148 },
  ];

  const treatmentPlanIds: string[] = [];

  for (const pd of PLAN_DEFS) {
    const practiceId = practices[pd.practiceIdx].id;
    const pubKey = publicKeys[pd.practiceIdx];
    const sample = TREATMENT_PLAN_SAMPLES[pd.sampleIdx];

    const enc = await encryptFormData(sample.data, pubKey);
    const encSummary = await encryptFormData(
      { summary: `${sample.type} Behandlung — ${sample.data.notes || ''}` },
      pubKey,
    );

    // Find a matching template
    const matchingTemplate = templateIds.find(
      (t) => t.practiceIdx === pd.practiceIdx && t.type === sample.type,
    );

    const plan = await prisma.treatmentPlan.create({
      data: {
        practiceId,
        patientId: patientIds[pd.patientIdx],
        consentFormId: consentFormIds[pd.consentIdx],
        templateId: matchingTemplate?.id,
        type: sample.type,
        encryptedSessionKey: enc.encryptedSessionKey,
        encryptedData: { iv: enc.iv, ciphertext: enc.ciphertext },
        encryptedSummary: { iv: encSummary.iv, ciphertext: encSummary.ciphertext },
        performedAt: pd.performed ? daysAgo(pd.createdDaysAgo - 1) : null,
        createdAt: daysAgo(pd.createdDaysAgo),
      },
    });
    treatmentPlanIds.push(plan.id);
  }

  // ── Step 12: Create treatment photos ──
  console.log('Creating treatment photos...');

  interface PhotoSeed {
    patientIdx: number;
    practiceIdx: number;
    planIdx: number;
    type: PhotoType;
    bodyRegion: BodyRegion;
    daysAgo: number;
  }

  const PHOTO_DEFS: PhotoSeed[] = [
    // Before/after pairs for practice 1
    { patientIdx: 0, practiceIdx: 0, planIdx: 0, type: PhotoType.BEFORE, bodyRegion: BodyRegion.FOREHEAD, daysAgo: 680 },
    { patientIdx: 0, practiceIdx: 0, planIdx: 0, type: PhotoType.AFTER, bodyRegion: BodyRegion.FOREHEAD, daysAgo: 665 },
    { patientIdx: 0, practiceIdx: 0, planIdx: 1, type: PhotoType.BEFORE, bodyRegion: BodyRegion.LIPS, daysAgo: 400 },
    { patientIdx: 0, practiceIdx: 0, planIdx: 1, type: PhotoType.AFTER, bodyRegion: BodyRegion.LIPS, daysAgo: 385 },
    { patientIdx: 1, practiceIdx: 0, planIdx: 2, type: PhotoType.BEFORE, bodyRegion: BodyRegion.CHEEKS, daysAgo: 550 },
    { patientIdx: 1, practiceIdx: 0, planIdx: 2, type: PhotoType.AFTER, bodyRegion: BodyRegion.CHEEKS, daysAgo: 535 },
    { patientIdx: 3, practiceIdx: 0, planIdx: 4, type: PhotoType.BEFORE, bodyRegion: BodyRegion.GLABELLA, daysAgo: 280 },
    { patientIdx: 3, practiceIdx: 0, planIdx: 4, type: PhotoType.AFTER, bodyRegion: BodyRegion.GLABELLA, daysAgo: 265 },
    // Before/after pairs for practice 2
    { patientIdx: 6, practiceIdx: 1, planIdx: 5, type: PhotoType.BEFORE, bodyRegion: BodyRegion.FOREHEAD, daysAgo: 480 },
    { patientIdx: 6, practiceIdx: 1, planIdx: 5, type: PhotoType.AFTER, bodyRegion: BodyRegion.FOREHEAD, daysAgo: 465 },
    { patientIdx: 7, practiceIdx: 1, planIdx: 6, type: PhotoType.BEFORE, bodyRegion: BodyRegion.CHEEKS, daysAgo: 330 },
    { patientIdx: 7, practiceIdx: 1, planIdx: 6, type: PhotoType.AFTER, bodyRegion: BodyRegion.CHEEKS, daysAgo: 315 },
  ];

  for (const ph of PHOTO_DEFS) {
    const practiceId = practices[ph.practiceIdx].id;
    const pubKey = publicKeys[ph.practiceIdx];

    const metadata = { description: `${ph.type} photo — ${ph.bodyRegion}`, camera: 'Canon EOS R5' };
    const encMeta = await encryptFormData(metadata, pubKey);

    // Encrypt a session key for the photo itself (storage path is the tiny PNG placeholder)
    const photoEnc = await encryptFormData({ placeholder: true }, pubKey);

    await prisma.treatmentPhoto.create({
      data: {
        practiceId,
        patientId: patientIds[ph.patientIdx],
        consentFormId: consentFormIds[PLAN_DEFS[ph.planIdx].consentIdx],
        treatmentPlanId: treatmentPlanIds[ph.planIdx],
        type: ph.type,
        bodyRegion: ph.bodyRegion,
        encryptedSessionKey: photoEnc.encryptedSessionKey,
        storagePath: `data:image/png;base64,${TINY_PNG_BASE64}`,
        encryptedMetadata: { iv: encMeta.iv, ciphertext: encMeta.ciphertext },
        photoConsentGranted: true,
        takenAt: daysAgo(ph.daysAgo),
        createdAt: daysAgo(ph.daysAgo),
      },
    });
  }

  // ── Step 13: Create audit logs ──
  console.log('Creating audit logs...');

  interface AuditSeed {
    practiceIdx: number;
    userIdx: number; // index into users array
    action: AuditAction;
    entityType?: string;
    daysAgo: number;
    ip: string;
  }

  const AUDIT_DEFS: AuditSeed[] = [
    // Practice 1 activity spread over 2 years
    { practiceIdx: 0, userIdx: 0, action: AuditAction.PRACTICE_SETTINGS_UPDATED, entityType: 'PracticeSettings', daysAgo: 729, ip: '192.168.1.10' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.VAULT_UNLOCKED, daysAgo: 700, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 2, action: AuditAction.PATIENT_CREATED, entityType: 'Patient', daysAgo: 700, ip: '192.168.1.30' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.CONSENT_CREATED, entityType: 'ConsentForm', daysAgo: 680, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.CONSENT_SUBMITTED, entityType: 'ConsentForm', daysAgo: 680, ip: '192.168.1.42' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.TREATMENT_PLAN_CREATED, entityType: 'TreatmentPlan', daysAgo: 678, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.PHOTO_UPLOADED, entityType: 'TreatmentPhoto', daysAgo: 678, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 0, action: AuditAction.TEAM_MEMBER_INVITED, entityType: 'Invite', daysAgo: 600, ip: '192.168.1.10' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.CONSENT_VIEWED, entityType: 'ConsentForm', daysAgo: 400, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.PATIENT_VIEWED, entityType: 'Patient', daysAgo: 300, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.CONSENT_REVOKED, entityType: 'ConsentForm', daysAgo: 293, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 0, action: AuditAction.SUBSCRIPTION_CREATED, entityType: 'Subscription', daysAgo: 365, ip: '192.168.1.10' },
    { practiceIdx: 0, userIdx: 1, action: AuditAction.TREATMENT_PLAN_VIEWED, entityType: 'TreatmentPlan', daysAgo: 150, ip: '192.168.1.20' },
    { practiceIdx: 0, userIdx: 2, action: AuditAction.CONSENT_CREATED, entityType: 'ConsentForm', daysAgo: 5, ip: '192.168.1.30' },
    // Practice 2 activity
    { practiceIdx: 1, userIdx: 3, action: AuditAction.PRACTICE_SETTINGS_UPDATED, entityType: 'PracticeSettings', daysAgo: 499, ip: '10.0.0.10' },
    { practiceIdx: 1, userIdx: 4, action: AuditAction.VAULT_UNLOCKED, daysAgo: 480, ip: '10.0.0.20' },
    { practiceIdx: 1, userIdx: 5, action: AuditAction.PATIENT_CREATED, entityType: 'Patient', daysAgo: 480, ip: '10.0.0.30' },
    { practiceIdx: 1, userIdx: 4, action: AuditAction.CONSENT_CREATED, entityType: 'ConsentForm', daysAgo: 478, ip: '10.0.0.20' },
    { practiceIdx: 1, userIdx: 4, action: AuditAction.TREATMENT_PLAN_CREATED, entityType: 'TreatmentPlan', daysAgo: 478, ip: '10.0.0.20' },
    { practiceIdx: 1, userIdx: 3, action: AuditAction.SUBSCRIPTION_CREATED, entityType: 'Subscription', daysAgo: 200, ip: '10.0.0.10' },
  ];

  for (const a of AUDIT_DEFS) {
    await prisma.auditLog.create({
      data: {
        practiceId: practices[a.practiceIdx].id,
        userId: users[a.userIdx].id,
        action: a.action,
        entityType: a.entityType,
        ipAddress: a.ip,
        createdAt: daysAgo(a.daysAgo),
      },
    });
  }

  // ── Done! Print summary ──

  console.log('\n============================================================');
  console.log('  SEED COMPLETE — 2-Year Production Simulation');
  console.log('============================================================\n');

  console.log('--- Practices ---');
  console.log(`  ${PRACTICE_1_ID}  Dermatologie Praxis Dr. Mueller (Berlin)`);
  console.log(`  ${PRACTICE_2_ID}  Hautklinik Dr. Schmidt (Munich)`);
  console.log(`  Master Password:  ${MASTER_PASSWORD}`);

  console.log('\n--- User Accounts (password: Test1234!) ---');
  for (const u of USER_DEFS) {
    console.log(`  ${u.email.padEnd(38)} ${u.role.padEnd(8)} Practice ${u.practiceIdx + 1}`);
  }

  console.log(`\n--- Patients: ${PATIENTS.length} ---`);
  for (const p of PATIENTS) {
    console.log(`  ${p.firstName} ${p.lastName.padEnd(12)} Practice ${p.practiceIdx + 1}  (created ${p.createdDaysAgo}d ago)`);
  }

  console.log(`\n--- Consent Forms: ${CONSENT_DEFS.length} ---`);
  const statusCounts: Record<string, number> = {};
  for (const c of CONSENT_DEFS) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status.padEnd(12)} ${count}`);
  }

  console.log('\n--- Pending Consent Links (testable in browser) ---');
  for (const c of CONSENT_DEFS.filter((c) => c.status === ConsentStatus.PENDING)) {
    console.log(`  http://localhost:3000/consent/${c.token}`);
  }

  console.log(`\n--- Treatment Templates: ${TEMPLATE_DATA.length * 2} (4 per practice) ---`);
  console.log(`--- Treatment Plans: ${PLAN_DEFS.length} ---`);
  console.log(`--- Treatment Photos: ${PHOTO_DEFS.length} (before/after pairs) ---`);
  console.log(`--- Audit Logs: ${AUDIT_DEFS.length} ---`);

  console.log('\n--- How to Test ---');
  console.log('  1. Start the app:       make dev');
  console.log('  2. Login at:            http://localhost:3000/login');
  console.log('     Use any email above + password: Test1234!');
  console.log('  3. Unlock vault with:   Test1234!');
  console.log('  4. Browse patients, consent forms, treatment plans');
  console.log('  5. Open a PENDING consent link in incognito for patient flow');
  console.log('');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
