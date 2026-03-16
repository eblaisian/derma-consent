import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { company } from '@/lib/company';

export default function DatenschutzPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link href="/"><ArrowLeft className="h-4 w-4 me-2" />Zurück</Link>
        </Button>

        <h1 className="text-page-title mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Datenschutz auf einen Blick</h2>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
              wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert
              werden können.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Verantwortliche Stelle</h2>
            <p>
              {company.name}<br />
              {company.street}<br />
              {company.city}<br />
              E-Mail: {company.email}<br />
              Telefon: {company.phone}
            </p>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über
              die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Datenerfassung auf dieser Website</h2>
            <h3 className="text-base font-medium text-foreground">Cookies</h3>
            <p>
              Diese Website verwendet Cookies. Dabei handelt es sich um technisch notwendige Cookies für die Funktionalität
              der Anwendung (Session-Cookie, Locale-Cookie). Es werden keine Tracking- oder Marketing-Cookies eingesetzt.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionsfähigen Website).
            </p>

            <h3 className="text-base font-medium text-foreground mt-4">Server-Log-Dateien</h3>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch Informationen in Server-Log-Dateien, die Ihr Browser
              automatisch an uns übermittelt (IP-Adresse, Browsertyp, Betriebssystem, Referrer URL, Uhrzeit der Serveranfrage).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Ende-zu-Ende-Verschlüsselung (Zero-Knowledge)</h2>
            <p>
              Alle Patientendaten werden clientseitig mit RSA-4096 und AES-256-GCM verschlüsselt, bevor sie unsere Server
              erreichen. Wir setzen eine Zero-Knowledge-Architektur ein: Der Server hat zu keinem Zeitpunkt Zugriff auf
              entschlüsselte Patientendaten. Die Entschlüsselung erfolgt ausschließlich im Browser der behandelnden Praxis
              unter Verwendung des praxiseigenen privaten Schlüssels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Auftragsverarbeiter</h2>
            <p>Wir setzen folgende Auftragsverarbeiter ein:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Vercel Inc.</strong> (USA) — Hosting der Frontend-Anwendung. Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO.</li>
              <li><strong>DigitalOcean Inc.</strong> (USA) — Datenbank-Hosting und Dateispeicherung (verschlüsselte PDFs). Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO.</li>
              <li><strong>Stripe Inc.</strong> (USA) — Zahlungsabwicklung. Zertifiziert nach EU-US Data Privacy Framework.</li>
              <li><strong>Resend Inc.</strong> (USA) — E-Mail-Versand. Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Ihre Rechte nach der DSGVO</h2>
            <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
              <li>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
              <li>Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Datenaufbewahrungsfristen</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Einwilligungsdaten:</strong> 10 Jahre nach Widerruf oder Ablauf (gesetzliche Aufbewahrungspflicht für medizinische Dokumentation)</li>
              <li><strong>Audit-Logs:</strong> 6 Jahre (handels- und steuerrechtliche Aufbewahrungspflichten)</li>
              <li><strong>Benutzerkontodaten:</strong> Bis zur Löschung des Kontos</li>
              <li><strong>Server-Logs:</strong> 30 Tage</li>
              <li><strong>Zahlungsdaten:</strong> 10 Jahre (steuerrechtliche Aufbewahrungspflicht gemäß AO)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Zahlungsabwicklung</h2>
            <p>
              Für die Zahlungsabwicklung nutzen wir den Dienst Stripe. Bei einer Zahlung werden Ihre Zahlungsdaten
              direkt an Stripe übermittelt. {company.productName} speichert keine Kreditkarten- oder Bankdaten.
              Die Datenschutzerklärung von Stripe finden Sie unter:{' '}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                https://stripe.com/de/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. SSL-/TLS-Verschlüsselung</h2>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine
              SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile
              des Browsers von &ldquo;http://&rdquo; auf &ldquo;https://&rdquo; wechselt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Änderung dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen
              Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Stand: März 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
