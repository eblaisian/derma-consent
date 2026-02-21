export function welcomeTemplate(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">Willkommen bei DermaConsent!</h2>
  <p>Hallo ${userName || 'dort'},</p>
  <p>Ihr Konto wurde erfolgreich erstellt. Mit DermaConsent koennen Sie:</p>
  <ul>
    <li>Digitale Einwilligungsformulare erstellen und versenden</li>
    <li>Patientendaten Ende-zu-Ende verschluesselt verwalten</li>
    <li>DSGVO-konform dokumentieren und archivieren</li>
    <li>GDT 2.1-Daten an Ihre Praxissoftware exportieren</li>
  </ul>
  <p>Starten Sie jetzt, indem Sie Ihre Praxis registrieren.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">DermaConsent — DSGVO-konforme digitale Einwilligungen</p>
</body>
</html>`;
}
