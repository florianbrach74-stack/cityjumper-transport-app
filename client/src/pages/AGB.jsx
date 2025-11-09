import { FileText, Phone, Mail, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function AGB() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-10 w-10 text-primary-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Allgemeine Geschäftsbedingungen (AGB)
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
            <p className="mt-4 text-sm text-gray-600">
              USt-IdNr.: [wird ggf. ergänzt]
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700">
              Preise gemäß der jeweils gültigen Preisliste auf{' '}
              <a href="https://www.courierly.de" className="text-primary-600 hover:underline">
                www.courierly.de
              </a>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Geltungsbereich und Begriffsbestimmungen
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">1.1</span> Diese Allgemeinen Geschäftsbedingungen (AGB) regeln sämtliche Transport-, Kurier- und Logistikleistungen der FB Transporte – Inhaber Florian Brach (nachfolgend „Auftragnehmer") gegenüber Kunden (nachfolgend „Kunde"), sowohl Unternehmern (§ 14 BGB) als auch Verbrauchern (§ 13 BGB).
              </p>
              <p>
                <span className="font-semibold">1.2</span> Für Unternehmer gelten ergänzend die Allgemeinen Deutschen Spediteurbedingungen (ADSp) in der jeweils aktuellen Fassung, bei grenzüberschreitenden Straßengütertransporten die CMR.
              </p>
              <p>
                <span className="font-semibold">1.3</span> Abweichende oder entgegenstehende AGB des Kunden werden nicht Vertragsbestandteil, sofern ihrer Geltung nicht ausdrücklich schriftlich zugestimmt wird.
              </p>
              <p>
                <span className="font-semibold">1.4</span> Begriffe wie „erste Abholzeit", „Wartezeit" oder „Standgeld" sind in Ziff. 6 erläutert.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Leistungsbeschreibung
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">2.1</span> Der Auftragnehmer organisiert die Abholung, Beförderung und Zustellung der Sendung entsprechend dem bestätigten Auftrag.
              </p>
              <p>
                <span className="font-semibold">2.2</span> Be- und Entladung: Erfolgt durch den Kunden/Versender/Empfänger, sofern nicht anders vereinbart.
              </p>
              <p>
                <span className="font-semibold">2.3</span> Zustellung: Gegen Empfangsbestätigung einer empfangsberechtigten Person.
              </p>
              <p>
                <span className="font-semibold">2.4</span> Ladehilfsmittel / Palettentausch: Nur bei ausdrücklicher Vereinbarung.
              </p>
              <p>
                <span className="font-semibold">2.5</span> Ausschlussgüter: Gefahrgut ohne ADR-Beauftragung, lebende Tiere, verderbliche Waren ohne Kühlauftrag, Wertsachen, Bargeld, Kunstwerke, etc.
              </p>
              <p>
                <span className="font-semibold">2.6</span> Erste Abholzeit: ist der im Auftrag bestätigte Beginn des Abholzeitfensters (Datum + Uhrzeit am Abholort).
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Vertragsschluss
            </h2>
            <p className="text-gray-700">
              Der Vertrag kommt zustande durch elektronische oder schriftliche Auftragsbestätigung des Auftragnehmers. Angebote sind freibleibend. Nach Übergabe der Sendung ist eine Änderung oder Kündigung nur nach den folgenden Regelungen möglich.
            </p>
          </section>

          {/* Section 4 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Preise und Zahlung
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">4.1</span> Es gelten die auf der Website{' '}
                <a href="https://www.courierly.de" className="text-primary-600 hover:underline">
                  www.courierly.de
                </a>{' '}
                veröffentlichten Preise und Zuschläge.
              </p>
              <p>
                <span className="font-semibold">4.2</span> Preise verstehen sich inkl. MwSt. für Privatkunden bzw. zzgl. MwSt. für Unternehmer, soweit nicht anders ausgewiesen.
              </p>
              <p>
                <span className="font-semibold">4.3</span> Zahlungsziel: 14 Tage netto ab Rechnungsdatum; bei Neukunden oder Privatkunden kann Vorkasse verlangt werden.
              </p>
              <p>
                <span className="font-semibold">4.4</span> Zusatzleistungen (Wartezeitüberschreitung, Zusatzstopps, Wochenend-/Feiertagseinsätze etc.) werden gemäß Preisliste berechnet.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Pflichten des Kunden
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">5.1</span> Verpackung und Kennzeichnung müssen transportsicher und gesetzeskonform erfolgen.
              </p>
              <p>
                <span className="font-semibold">5.2</span> Der Kunde hat vollständige, richtige Angaben zu Abhol- und Zustelladresse, Inhalt, Maßen, Gewichten und Besonderheiten zu machen.
              </p>
              <p>
                <span className="font-semibold">5.3</span> Bei fehlerhaften Angaben oder fehlender Entladehilfe kann der Auftrag als nicht ausführbar gelten (siehe Ziff. 6.3 / 7.5).
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Wartezeiten, Standgeld, Nichtdurchführbarkeit
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-2">6.1 Inklusive Wartezeit:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>PKW / Transporter (bis 3,5 t): 30 Minuten je Lade- oder Entladestelle</li>
                  <li>LKW (≥ 7,5 t): 60 Minuten je Lade- oder Entladestelle</li>
                </ul>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                <p className="font-semibold text-orange-900 mb-2">6.2 Wartezeitüberschreitung / Standgeld:</p>
                <p className="text-orange-800">
                  Nach Ablauf der Inklusivzeit werden <span className="font-bold">3,00 € je angefangene 5 Minuten (= 36 €/h)</span> berechnet.
                  Der Auftragnehmer kann den Zeitnachweis per GPS/Telematik oder Zeitstempel führen.
                </p>
              </div>
              <p>
                <span className="font-semibold">6.3</span> Nichtdurchführbarkeit: Wenn der Transport aufgrund vom Kunden zu vertretender Umstände (falsche Adresse, keine Entladung, fehlende Genehmigung etc.) nicht erfolgen kann, kann der Auftragnehmer Rückführung, Einlagerung oder erneute Zustellung gegen Vergütung veranlassen. Eine Mindestvergütung nach Ziff. 7.5 bleibt unberührt.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Stornierung, Kündigung und Ersatzleistung
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold text-lg mb-2">7.1 Stornierung durch den Kunden</p>
                <div className="space-y-2 ml-4">
                  <p><span className="font-semibold">a)</span> Kostenfrei bis 24 Stunden vor der ersten Abholzeit.</p>
                  <p><span className="font-semibold">b)</span> Innerhalb von 24 Stunden vor der ersten Abholzeit:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>50 % der vereinbarten Frachtkosten</li>
                    <li>Wurde der Auftrag bereits gestartet (Fahrer auf dem Weg oder am Abholort): 75 % der vereinbarten Frachtkosten</li>
                    <li>Bereits entstandene Zusatz- oder Drittkosten werden zusätzlich berechnet</li>
                  </ul>
                  <p><span className="font-semibold">c)</span> Nach Übergabe der Sendung ist eine Kündigung ausgeschlossen, soweit kein gesetzliches Rücktrittsrecht besteht.</p>
                </div>
              </div>
              <p>
                <span className="font-semibold">7.2</span> Stornierung durch den Auftragnehmer: Bei Fahrzeugausfall, Krankheit, technischer Störung, höherer Gewalt oder anderen wichtigen Gründen kann der Auftragnehmer vom Vertrag zurücktreten. Der Kunde wird unverzüglich informiert und erhält, sofern möglich, ein Ersatzangebot zu gleichen Konditionen. Bereits geleistete Zahlungen werden im Falle der Nichterbringung erstattet.
              </p>
              <p>
                <span className="font-semibold">7.3</span> Änderungen durch den Kunden innerhalb 24 Stunden vor der Abholzeit gelten als Stornierung + Neubeauftragung, sofern keine einvernehmliche Umplanung vereinbart wird.
              </p>
              <p>
                <span className="font-semibold">7.4</span> Höhere Gewalt: siehe Ziff. 9.
              </p>
              <p>
                <span className="font-semibold">7.5</span> Mindestvergütung bei Nichtdurchführbarkeit aus Kundensphäre: pauschal 25 € zzgl. Anfahrt/Standgeld/Rückführung, sofern kein geringerer Aufwand nachgewiesen wird.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Haftung und Versicherung
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">8.1</span> Es gelten die gesetzlichen Haftungsregelungen nach HGB und CMR.
              </p>
              <p>
                <span className="font-semibold">8.2</span> Haftungshöchstgrenze: 8,33 SZR/kg (§ 431 HGB / Art. 23 CMR).
              </p>
              <p>
                <span className="font-semibold">8.3</span> Höhere Deckung bis 40 SZR/kg auf schriftlichen Wunsch gegen Aufpreis.
              </p>
              <p>
                <span className="font-semibold">8.4</span> FB Transporte verfügt über eine gesetzeskonforme Verkehrshaftungsversicherung.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Höhere Gewalt / unvorhersehbare Ereignisse
            </h2>
            <p className="text-gray-700">
              Keine Partei haftet für Leistungsverzögerungen oder Ausfälle infolge von Ereignissen außerhalb ihres Einflussbereichs (z. B. Naturereignisse, Streiks, behördliche Maßnahmen, Pandemien, großflächige Verkehrsbehinderungen).
              Während der Dauer solcher Ereignisse ruhen die beiderseitigen Pflichten; nach 10 Tagen kann jede Partei vom Vertrag hinsichtlich des betroffenen Auftrags zurücktreten.
            </p>
          </section>

          {/* Section 10 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Datenschutz
            </h2>
            <p className="text-gray-700">
              FB Transporte verarbeitet personenbezogene Daten gemäß DSGVO und BDSG. Näheres siehe Datenschutzerklärung unter{' '}
              <a href="https://www.courierly.de/datenschutz" className="text-primary-600 hover:underline font-semibold">
                👉 www.courierly.de/datenschutz
              </a>.
              Zur Durchführung des Auftrags dürfen Daten an Unterauftragnehmer, Empfänger oder Behörden weitergegeben werden.
            </p>
          </section>

          {/* Section 11 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Verbraucherinformationen / Widerrufsrecht
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-green-50 border-l-4 border-green-500 p-6">
                <h3 className="font-bold text-green-900 text-lg mb-3">11.1 Widerrufsbelehrung für Verbraucher</h3>
                <div className="space-y-3 text-green-800">
                  <p className="font-semibold">Widerrufsrecht</p>
                  <p>
                    Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                    Die Widerrufsfrist beträgt 14 Tage ab dem Tag des Vertragsabschlusses.
                  </p>
                  <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns</p>
                  <div className="ml-4 font-medium">
                    <p>FB Transporte – Inhaber Florian Brach</p>
                    <p>Adolf-Menzel-Straße 71</p>
                    <p>12621 Berlin</p>
                    <p>Telefon 0172 421 6672</p>
                    <p>E-Mail info@courierly.de</p>
                  </div>
                  <p>
                    mittels einer eindeutigen Erklärung (z. B. Brief, E-Mail) über Ihren Entschluss informieren, den Vertrag zu widerrufen.
                    Zur Wahrung der Frist reicht es aus, dass Sie die Mitteilung vor Ablauf der Widerrufsfrist absenden.
                  </p>
                  <p className="font-semibold mt-4">Folgen des Widerrufs:</p>
                  <p>
                    Wenn Sie diesen Vertrag widerrufen, erstatten wir alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich Lieferkosten (mit Ausnahme zusätzlicher Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die angebotene Standardlieferung gewählt haben), unverzüglich und spätestens binnen 14 Tagen ab Eingang Ihres Widerrufs.
                    Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie eingesetzt haben, es sei denn, es wurde ausdrücklich etwas anderes vereinbart.
                  </p>
                  <p className="font-semibold mt-4 text-red-700">Besonderer Hinweis:</p>
                  <p className="text-red-700">
                    Ihr Widerrufsrecht erlischt, wenn der Transport vollständig erbracht wurde und mit Ihrer ausdrücklichen Zustimmung vor Ablauf der Widerrufsfrist begonnen wurde.
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg mb-2">11.2 Pflichten für Verbraucher</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Der Kunde hat sicherzustellen, dass die Sendung transportfähig, ordnungsgemäß verpackt und am vereinbarten Ort/Termin abholbereit ist.</li>
                  <li>Wartezeiten, fehlerhafte Adressen oder fehlende Entladehilfe können Zusatzkosten verursachen.</li>
                  <li>Preise für Verbraucher verstehen sich inklusive Mehrwertsteuer.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Gerichtsstand und Schlussbestimmungen
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <span className="font-semibold">12.1</span> Für Unternehmer ist Gerichtsstand Berlin.
              </p>
              <p>
                <span className="font-semibold">12.2</span> Es gilt deutsches Recht; das UN-Kaufrecht ist ausgeschlossen.
              </p>
              <p>
                <span className="font-semibold">12.3</span> Änderungen oder Nebenabreden bedürfen der Textform.
              </p>
              <p>
                <span className="font-semibold">12.4</span> Sollte eine Klausel unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Stand:</span> 06. November 2025 • <span className="font-semibold">Version</span> 1.0
            </p>
          </div>
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
