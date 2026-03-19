import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { AnalyticsController } from '../analytics/analytics.controller';
import { PatientController } from '../patient/patient.controller';
import { ConsentController } from '../consent/consent.controller';
import { CommunicationsController } from '../communications/communications.controller';
import { BillingController } from '../billing/billing.controller';
import { TeamController } from '../team/team.controller';
import { AuditController } from '../audit/audit.controller';
import { SettingsController } from '../settings/settings.controller';
import { TreatmentPlanController } from '../treatment-plan/treatment-plan.controller';
import { PhotoController } from '../photo/photo.controller';

/**
 * Tests the complete role-access matrix by inspecting @Roles() decorator
 * metadata on controller methods. This ensures the authorization matrix
 * stays correct even when code changes — no running server needed.
 *
 * Role hierarchy for this product:
 * - ADMIN:   Full access — business operations, clinical, and administrative
 * - ARZT:    Clinical access — patients, consents, photos, treatment plans
 * - EMPFANG: Front desk — patients (limited), consents (view/create), communications
 */
describe('Role Access Matrix', () => {
  const reflector = new Reflector();

  function getMethodRoles(controller: Function, methodName: string): string[] | undefined {
    const method = controller.prototype[methodName];
    return reflector.get<string[]>(ROLES_KEY, method);
  }

  function getClassRoles(controller: Function): string[] | undefined {
    return reflector.get<string[]>(ROLES_KEY, controller);
  }

  /** Resolves effective roles: method-level overrides class-level */
  function effectiveRoles(controller: Function, methodName: string): string[] | undefined {
    return getMethodRoles(controller, methodName) ?? getClassRoles(controller);
  }

  function expectAdminOnly(controller: Function, method: string) {
    const roles = effectiveRoles(controller, method);
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
    expect(roles).not.toContain('ARZT');
    expect(roles).not.toContain('EMPFANG');
  }

  function expectClinical(controller: Function, method: string) {
    const roles = effectiveRoles(controller, method);
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
    expect(roles).toContain('ARZT');
    expect(roles).not.toContain('EMPFANG');
  }

  function expectAllRoles(controller: Function, method: string) {
    const roles = effectiveRoles(controller, method);
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
    expect(roles).toContain('ARZT');
    expect(roles).toContain('EMPFANG');
  }

  // ── Analytics: ADMIN only ──────────────────────────────────────────

  describe('AnalyticsController — ADMIN only', () => {
    const endpoints = [
      'getOverview',
      'getByType',
      'getByPeriod',
      'getConversion',
      'getRevenue',
      'getRetentionFlags',
      'getInsights',
    ];

    it.each(endpoints)('%s → ADMIN only', (method) => {
      expectAdminOnly(AnalyticsController, method);
    });
  });

  // ── Patients: all roles (except delete = ADMIN only) ──────────────

  describe('PatientController', () => {
    it.each(['findAll', 'findById', 'create', 'findByLookupHash'])(
      '%s → ADMIN + ARZT + EMPFANG',
      (method) => {
        expectAllRoles(PatientController, method);
      },
    );

    it('delete → ADMIN only', () => {
      expectAdminOnly(PatientController, 'delete');
    });
  });

  // ── Consents ──────────────────────────────────────────────────────

  describe('ConsentController', () => {
    it('listPracticeConsents → ADMIN + ARZT + EMPFANG', () => {
      expectAllRoles(ConsentController, 'findByPractice');
    });

    it('downloadPdf → ADMIN + ARZT (clinical)', () => {
      expectClinical(ConsentController, 'downloadPdf');
    });

    it('revoke → ADMIN + ARZT (clinical)', () => {
      expectClinical(ConsentController, 'revoke');
    });
  });

  // ── Communications: all roles ─────────────────────────────────────

  describe('CommunicationsController — all roles', () => {
    it.each(['generateDraft', 'sendMessage'])(
      '%s → ADMIN + ARZT + EMPFANG',
      (method) => {
        expectAllRoles(CommunicationsController, method);
      },
    );
  });

  // ── Treatment Plans: clinical (ADMIN + ARZT) ─────────────────────

  describe('TreatmentPlanController — clinical only', () => {
    // Class-level @Roles decorator
    it('class-level roles should be ADMIN + ARZT', () => {
      const roles = getClassRoles(TreatmentPlanController);
      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('ARZT');
      expect(roles).not.toContain('EMPFANG');
    });
  });

  // ── Photos: clinical (ADMIN + ARZT) ──────────────────────────────

  describe('PhotoController — clinical only', () => {
    it('class-level roles should be ADMIN + ARZT', () => {
      const roles = getClassRoles(PhotoController);
      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('ARZT');
      expect(roles).not.toContain('EMPFANG');
    });
  });

  // ── Admin-only controllers ────────────────────────────────────────

  describe('BillingController — ADMIN only', () => {
    it.each(['getSubscription', 'getUsage', 'createCheckout', 'createPortal'])(
      '%s → ADMIN only',
      (method) => {
        expectAdminOnly(BillingController, method);
      },
    );
  });

  describe('TeamController — ADMIN only', () => {
    it.each(['listMembers', 'createInvite', 'removeMember', 'changeRole', 'listPendingInvites', 'resendInvite', 'revokeInvite'])(
      '%s → ADMIN only',
      (method) => {
        expectAdminOnly(TeamController, method);
      },
    );
  });

  describe('SettingsController — ADMIN only', () => {
    it('class-level roles should be ADMIN only', () => {
      const roles = getClassRoles(SettingsController);
      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).not.toContain('ARZT');
      expect(roles).not.toContain('EMPFANG');
    });
  });

  describe('AuditController', () => {
    it('findAll → ADMIN only', () => {
      expectAdminOnly(AuditController, 'findAll');
    });

    it('exportCsv → ADMIN only', () => {
      expectAdminOnly(AuditController, 'exportCsv');
    });

    it('vaultEvent → ADMIN + ARZT + EMPFANG', () => {
      expectAllRoles(AuditController, 'vaultEvent');
    });
  });
});
