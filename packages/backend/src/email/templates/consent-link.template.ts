export function consentLinkTemplate(practiceName: string, consentLink: string, expiryDays: number): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">Einwilligungsformular</h2>
  <p>Sehr geehrte/r Patient/in,</p>
  <p>die Praxis <strong>${practiceName}</strong> hat ein digitales Einwilligungsformular fuer Sie erstellt.</p>
  <p>Bitte klicken Sie auf den folgenden Link, um das Formular auszufuellen:</p>
  <p style="margin: 24px 0;">
    <a href="${consentLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Formular oeffnen
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">Dieser Link ist ${expiryDays} Tage gueltig.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">
    Diese E-Mail wurde ueber DermaConsent versendet. Ihre Daten werden Ende-zu-Ende verschluesselt.
  </p>
</body>
</html>`;
}
