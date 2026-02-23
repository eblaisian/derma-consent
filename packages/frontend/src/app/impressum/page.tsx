import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link href="/"><ArrowLeft className="h-4 w-4 me-2" />Zurueck</Link>
        </Button>

        <h1 className="text-page-title mb-8">Impressum</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Angaben gemaess § 5 TMG</h2>
            <p>
              [COMPANY_NAME]<br />
              [ADDRESS_STREET]<br />
              [ADDRESS_CITY]<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
            <p>
              Telefon: [PHONE]<br />
              E-Mail: [EMAIL]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemaess § 27a Umsatzsteuergesetz:<br />
              [UST_ID]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Verantwortlich fuer den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              [RESPONSIBLE_PERSON]<br />
              [ADDRESS_STREET]<br />
              [ADDRESS_CITY]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">EU-Streitschlichtung</h2>
            <p>
              Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Haftung fuer Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemaess § 7 Abs.1 TMG fuer eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, uebermittelte oder gespeicherte fremde Informationen zu
              ueberwachen oder nach Umstaenden zu forschen, die auf eine rechtswidrige Taetigkeit hinweisen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Haftung fuer Links</h2>
            <p>
              Unser Angebot enthaelt Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb koennen wir fuer diese fremden Inhalte auch keine Gewaehr uebernehmen. Fuer die Inhalte der verlinkten
              Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
              Die Vervielfaeltigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes
              beduerfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
