import { FileText, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Widerruf() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-10 w-10 text-primary-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Widerrufsbelehrung für Verbraucher
            </h1>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-bold text-primary-600 mb-4">
              FB Transporte – Inhaber Florian Brach
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="font-medium">Adolf-Menzel-Straße 71</p>
                  <p>12621 Berlin</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-primary-600" />
                  <a href="tel:01724216672" className="hover:text-primary-600">0172 421 6672</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-primary-600" />
                  <a href="mailto:info@courierly.de" className="hover:text-primary-600">info@courierly.de</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* Widerrufsrecht */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Widerrufsrecht</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Sie haben das Recht, binnen <span className="font-semibold">14 Tagen</span> ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              </p>
              <p>
                Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.
              </p>
              <p>
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
              </p>
              <div className="ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-primary-600">
                <p className="font-semibold">FB Transporte – Inhaber Florian Brach</p>
                <p>Adolf-Menzel-Straße 71</p>
                <p>12621 Berlin</p>
                <p className="mt-2">Telefon: 0172 421 6672</p>
                <p>E-Mail: info@courierly.de</p>
              </div>
              <p>
                mittels einer eindeutigen Erklärung (z. B. per Brief oder E-Mail) über Ihren Entschluss informieren, diesen Vertrag zu widerrufen.
              </p>
              <p>
                Sie können dafür das nachfolgende <a href="#muster" className="text-primary-600 hover:underline font-semibold">Muster-Widerrufsformular</a> verwenden, das jedoch nicht vorgeschrieben ist.
              </p>
              <p>
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Frist absenden.
              </p>
            </div>
          </section>

          {/* Folgen des Widerrufs */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Folgen des Widerrufs</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene Standardlieferung gewählt haben), unverzüglich und spätestens binnen 14 Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.
              </p>
              <p>
                Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
              </p>
            </div>
          </section>

          {/* Besonderer Hinweis */}
          <section className="border-t border-gray-200 pt-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-red-900 mb-3">
                    Besonderer Hinweis: Erlöschen des Widerrufsrechts
                  </h2>
                  <div className="space-y-3 text-red-800">
                    <p className="font-semibold">
                      Ihr Widerrufsrecht erlischt vorzeitig, wenn der Vertrag von beiden Seiten auf Ihren ausdrücklichen Wunsch vollständig erfüllt wurde, bevor Sie Ihr Widerrufsrecht ausgeübt haben.
                    </p>
                    <p>
                      <span className="font-semibold">Das bedeutet:</span> Wenn Sie ausdrücklich zustimmen, dass FB Transporte die Transportdienstleistung vor Ablauf der Widerrufsfrist ausführt, und die Leistung vollständig erbracht ist, besteht kein Widerrufsrecht mehr.
                    </p>
                    <p className="text-sm italic">
                      Bei der Auftragserteilung werden Sie gebeten, dieser sofortigen Ausführung ausdrücklich zuzustimmen und zu bestätigen, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung verlieren.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Muster-Widerrufsformular */}
          <section id="muster" className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Muster-Widerrufsformular</h2>
            <p className="text-gray-600 mb-4 italic">
              (wenn Sie den Vertrag widerrufen möchten, füllen Sie bitte dieses Formular aus und senden es zurück)
            </p>
            
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-8">
              <p className="font-semibold mb-4">An</p>
              <div className="ml-4 mb-6">
                <p className="font-semibold">FB Transporte – Inhaber Florian Brach</p>
                <p>Adolf-Menzel-Straße 71</p>
                <p>12621 Berlin</p>
                <p className="mt-2">E-Mail: info@courierly.de</p>
              </div>

              <div className="space-y-6">
                <p>
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung folgender Dienstleistung:
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bestellt am / erhalten am:
                    </label>
                    <div className="border-b-2 border-gray-400 pb-1">
                      __________________________________________________
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name des/der Verbraucher(s):
                    </label>
                    <div className="border-b-2 border-gray-400 pb-1">
                      __________________________________________________
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anschrift des/der Verbraucher(s):
                    </label>
                    <div className="border-b-2 border-gray-400 pb-1">
                      __________________________________________________
                    </div>
                    <div className="border-b-2 border-gray-400 pb-1 mt-2">
                      __________________________________________________
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Datum:
                      </label>
                      <div className="border-b-2 border-gray-400 pb-1">
                        ____________________________
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unterschrift (nur bei Mitteilung auf Papier):
                      </label>
                      <div className="border-b-2 border-gray-400 pb-1">
                        ____________________________
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 italic mt-6">
                  (*) Unzutreffendes streichen.
                </p>
              </div>
            </div>
          </section>

          {/* Hinweise für Verbraucher */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Hinweise und Pflichten für Verbraucher (Privatkunden)
            </h2>
            <p className="text-gray-700 mb-4">
              Damit ein Transportauftrag reibungslos und sicher ausgeführt werden kann, gelten für Privatkunden folgende Pflichten und Hinweise:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Transportfähigkeit der Sendung</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Die Sendung muss transportsicher verpackt und handhabbar sein (z. B. Karton, Palette, stabile Verpackung)</li>
                  <li>Flüssigkeiten, Glas, empfindliche oder spitze Gegenstände sind so zu sichern, dass sie keine Beschädigung anderer Güter verursachen können</li>
                  <li>Keine Beförderung von Gefahrgut, Tieren, Wertgegenständen oder verderblichen Waren ohne ausdrückliche Vereinbarung</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Abhol- und Zustellbedingungen</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Der Kunde stellt sicher, dass die Sendung zum vereinbarten Zeitpunkt am Abholort bereitsteht</li>
                  <li>Zufahrt und Zugang für das beauftragte Fahrzeug (PKW, Transporter oder LKW) müssen gewährleistet sein</li>
                  <li>Der Empfänger muss unter der angegebenen Adresse erreichbar sein</li>
                  <li>Wartezeiten durch Nichtbereitstellung oder verspätetes Erscheinen können gemäß AGB berechnet werden (nach Inklusivzeit: 3 € je 5 Minuten)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Angaben und Kommunikation</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Abhol- und Zustelladressen, Telefonnummern, Maße, Gewichte und Besonderheiten sind vollständig und korrekt anzugeben</li>
                  <li>Änderungen (z. B. Zeitverschiebung, Adresskorrektur) sind rechtzeitig mitzuteilen – spätestens 24 Stunden vor der geplanten Abholung</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">4. Haftung und Versicherung</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Die gesetzliche Haftung richtet sich nach HGB (§ 431) bzw. CMR bei Auslandstransporten</li>
                  <li>Für Privatkunden gilt eine Haftungsgrenze von 8,33 SZR pro Kilogramm, sofern keine gesonderte Transportversicherung vereinbart wurde</li>
                  <li>Schäden müssen unverzüglich, spätestens innerhalb von 7 Tagen gemeldet werden</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">5. Stornierung / Rücktritt</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Bis 24 Stunden vor der Abholzeit kostenfrei</li>
                  <li>Innerhalb von 24 Stunden: 50 % der vereinbarten Frachtkosten</li>
                  <li>Wenn der Fahrer bereits unterwegs oder am Abholort ist: 75 %</li>
                  <li>Bereits entstandene Zusatzkosten (z. B. Standgeld, Maut, Disposition) bleiben hiervon unberührt</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">6. Preise und Zahlung</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Alle Verbraucherpreise sind Endpreise inkl. MwSt.</li>
                  <li>Zahlung per Überweisung, Vorkasse oder bar bei Lieferung, sofern nicht anders vereinbart</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
