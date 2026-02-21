const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  ARZT: 'Arzt',
  EMPFANG: 'Empfang',
};

export function inviteTemplate(practiceName: string, role: string, inviteLink: string): string {
  const roleLabel = roleLabels[role] || role;

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">Einladung zu DermaConsent</h2>
  <p>Sie wurden eingeladen, der Praxis <strong>${practiceName}</strong> als <strong>${roleLabel}</strong> beizutreten.</p>
  <p>Klicken Sie auf den folgenden Link, um die Einladung anzunehmen:</p>
  <p style="margin: 24px 0;">
    <a href="${inviteLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Einladung annehmen
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">Diese Einladung ist 7 Tage gueltig.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">DermaConsent — DSGVO-konforme digitale Einwilligungen</p>
</body>
</html>`;
}
