export function subscriptionTemplate(type: 'trial_expiring' | 'payment_failed', practiceName: string): string {
  if (type === 'trial_expiring') {
    return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">Ihre Testphase laeuft bald ab</h2>
  <p>Die kostenlose Testphase fuer <strong>${practiceName}</strong> endet in 3 Tagen.</p>
  <p>Um DermaConsent weiterhin nutzen zu koennen, waehlen Sie bitte einen Tarif aus:</p>
  <p style="margin: 24px 0;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Tarif waehlen
    </a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">DermaConsent — DSGVO-konforme digitale Einwilligungen</p>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #b91c1c;">Zahlungsproblem</h2>
  <p>Die letzte Zahlung fuer <strong>${practiceName}</strong> konnte nicht verarbeitet werden.</p>
  <p>Bitte aktualisieren Sie Ihre Zahlungsinformationen, um eine Unterbrechung des Dienstes zu vermeiden:</p>
  <p style="margin: 24px 0;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" style="background-color: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Zahlung aktualisieren
    </a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">DermaConsent — DSGVO-konforme digitale Einwilligungen</p>
</body>
</html>`;
}
