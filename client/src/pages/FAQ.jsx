import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, User, Lock, Truck, CreditCard, FileText, Shield, Clock, Mail, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function FAQ() {
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleCategory = (category) => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenQuestion(null);
  };

  const toggleQuestion = (questionId) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Erste Schritte',
      icon: HelpCircle,
      color: 'bg-blue-500',
      questions: [
        {
          id: 'what-is-courierly',
          question: 'Was ist Courierly?',
          answer: 'Courierly ist eine moderne Transport-Management-Plattform, die Kunden mit professionellen Kurierdienstleistern verbindet. Wir bieten schnelle, zuverlässige und transparente Transportlösungen für Privat- und Geschäftskunden in ganz Deutschland.'
        },
        {
          id: 'how-it-works',
          question: 'Wie funktioniert Courierly?',
          answer: 'Ganz einfach: Sie erstellen einen Auftrag mit Abhol- und Zustelladresse, erhalten sofort eine Preisberechnung, und verifizierte Auftragnehmer können sich auf Ihren Auftrag bewerben. Nach Ihrer Freigabe wird der Transport durchgeführt und Sie erhalten alle Dokumente per Email.'
        },
        {
          id: 'who-can-use',
          question: 'Wer kann Courierly nutzen?',
          answer: 'Courierly richtet sich an drei Nutzergruppen: Kunden (Privat- und Firmenkunden), die Transportdienstleistungen benötigen, Auftragnehmer (Kurierunternehmen), die Aufträge durchführen möchten, und deren Mitarbeiter, die Aufträge abwickeln.'
        },
        {
          id: 'coverage-area',
          question: 'In welchen Regionen ist Courierly verfügbar?',
          answer: 'Courierly ist deutschlandweit verfügbar. Unsere Plattform unterstützt Transporte in allen Städten und Regionen Deutschlands. Die Verfügbarkeit von Auftragnehmern kann je nach Region variieren.'
        }
      ]
    },
    {
      id: 'registration',
      title: 'Registrierung & Anmeldung',
      icon: User,
      color: 'bg-green-500',
      questions: [
        {
          id: 'how-to-register',
          question: 'Wie registriere ich mich?',
          answer: 'Klicken Sie auf "Registrieren" in der oberen rechten Ecke. Wählen Sie Ihre Rolle (Kunde oder Auftragnehmer), geben Sie Ihre Daten ein (Vorname, Nachname, Email, Telefon, Passwort) und akzeptieren Sie die AGB. Nach erfolgreicher Registrierung werden Sie automatisch eingeloggt.'
        },
        {
          id: 'customer-vs-contractor',
          question: 'Was ist der Unterschied zwischen Kunde und Auftragnehmer?',
          answer: 'Kunden erstellen Transportaufträge und bezahlen für die Dienstleistung. Auftragnehmer sind professionelle Kurierunternehmen, die sich auf Aufträge bewerben und diese durchführen. Als Auftragnehmer benötigen Sie eine Verifizierung (Gewerbeanmeldung, Transportversicherung).'
        },
        {
          id: 'private-vs-business',
          question: 'Kann ich als Privatkunde und als Firma registrieren?',
          answer: 'Ja! Bei der Registrierung als Kunde können Sie zwischen Privatkunde und Firmenkunde wählen. Firmenkunden können zusätzliche Firmendaten (Firmenname, Adresse, USt-IdNr, Steuernummer) hinterlegen, die automatisch für Rechnungen verwendet werden.'
        },
        {
          id: 'email-already-exists',
          question: 'Was bedeutet "Email bereits registriert"?',
          answer: 'Jede Email-Adresse kann nur einmal registriert werden. Wenn Sie diese Meldung erhalten, haben Sie bereits ein Konto oder jemand anderes nutzt diese Email. Versuchen Sie sich einzuloggen oder nutzen Sie die "Passwort vergessen"-Funktion.'
        },
        {
          id: 'password-requirements',
          question: 'Welche Anforderungen gibt es an das Passwort?',
          answer: 'Ihr Passwort muss mindestens 8 Zeichen lang sein und sollte aus Sicherheitsgründen Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen enthalten. Verwenden Sie ein einzigartiges Passwort, das Sie nicht für andere Dienste nutzen.'
        }
      ]
    },
    {
      id: 'password-security',
      title: 'Passwort & Sicherheit',
      icon: Lock,
      color: 'bg-red-500',
      questions: [
        {
          id: 'forgot-password',
          question: 'Ich habe mein Passwort vergessen. Was kann ich tun?',
          answer: 'Klicken Sie auf der Login-Seite auf "Passwort vergessen?". Geben Sie Ihre Email-Adresse ein und Sie erhalten einen Link zum Zurücksetzen Ihres Passworts. Der Link ist 1 Stunde gültig. Folgen Sie den Anweisungen in der Email, um ein neues Passwort zu setzen.'
        },
        {
          id: 'change-password',
          question: 'Wie ändere ich mein Passwort?',
          answer: 'Loggen Sie sich ein und gehen Sie zu "Einstellungen" (über Ihr Profil-Menü oben rechts). Dort finden Sie den Bereich "Passwort ändern". Geben Sie Ihr aktuelles Passwort und zweimal Ihr neues Passwort ein. Klicken Sie auf "Passwort ändern".'
        },
        {
          id: 'account-security',
          question: 'Wie sicher ist mein Account?',
          answer: 'Wir verwenden JWT-basierte Authentifizierung und verschlüsseln alle Passwörter mit bcrypt. Ihre Daten werden über HTTPS übertragen. Zusätzlich speichern wir niemals Ihr Passwort im Klartext. Für maximale Sicherheit empfehlen wir ein starkes, einzigartiges Passwort.'
        },
        {
          id: 'logout',
          question: 'Wie logge ich mich aus?',
          answer: 'Klicken Sie oben rechts auf Ihr Profil-Symbol und wählen Sie "Abmelden". Sie werden automatisch ausgeloggt und zur Startseite weitergeleitet. Ihr Login-Token wird dabei gelöscht.'
        }
      ]
    },
    {
      id: 'orders',
      title: 'Aufträge erstellen & verwalten',
      icon: Truck,
      color: 'bg-sky-500',
      questions: [
        {
          id: 'create-order',
          question: 'Wie erstelle ich einen Auftrag?',
          answer: 'Nach dem Login klicken Sie auf "Neuer Auftrag". Geben Sie Abhol- und Zustelladresse ein (mit Autocomplete-Unterstützung), wählen Sie Datum und Uhrzeit, geben Sie Sendungsdetails ein (Maße, Gewicht, Anzahl). Der Preis wird automatisch berechnet. Prüfen Sie alle Angaben und klicken Sie auf "Auftrag erstellen".'
        },
        {
          id: 'price-calculation',
          question: 'Wie wird der Preis berechnet?',
          answer: 'Der Preis basiert auf Distanz (€/km) und Fahrzeit (€/Stunde). Wir verwenden echte Straßenrouten (OSRM) für präzise Berechnungen. Der Mindestpreis garantiert faire Bezahlung für Fahrer (Mindestlohn). Sie sehen den empfohlenen Preis und können diesen anpassen (Mindestpreis darf nicht unterschritten werden).'
        },
        {
          id: 'waiting-time',
          question: 'Was sind Wartezeit-Gebühren?',
          answer: 'Wenn der Fahrer am Abhol- oder Zustellort warten muss (z.B. Ladezeit, Verzögerungen), können Wartezeit-Gebühren anfallen. Die ersten 15 Minuten sind inklusive. Danach werden €6,00 pro 5 Minuten berechnet. Diese Gebühren müssen vom Administrator genehmigt werden und erscheinen separat auf Ihrer Rechnung.'
        },
        {
          id: 'order-status',
          question: 'Welche Auftragsstatus gibt es?',
          answer: 'Pending (Auftrag erstellt, wartet auf Bewerbungen), Assigned (Auftragnehmer zugewiesen), Picked Up (Paket abgeholt, unterwegs), Delivered (Zugestellt, abgeschlossen), Cancelled (Storniert). Sie erhalten Email-Benachrichtigungen bei jedem Statuswechsel.'
        },
        {
          id: 'cancel-order',
          question: 'Kann ich einen Auftrag stornieren?',
          answer: 'Ja, aber es können Gebühren anfallen: Mehr als 24h vor Abholung: kostenlos. Weniger als 24h vor Abholung: 50% Gebühr. Fahrer bereits unterwegs: 75% Gebühr. Diese Regelungen sind in unseren AGB festgelegt und dienen dem Schutz der Auftragnehmer.'
        },
        {
          id: 'edit-order',
          question: 'Kann ich einen Auftrag nachträglich ändern?',
          answer: 'Solange der Auftrag noch im Status "Pending" ist, können Sie ihn stornieren und neu erstellen. Nach Zuweisung an einen Auftragnehmer kontaktieren Sie bitte unseren Support für Änderungen.'
        }
      ]
    },
    {
      id: 'payment-invoices',
      title: 'Zahlung & Rechnungen',
      icon: CreditCard,
      color: 'bg-amber-500',
      questions: [
        {
          id: 'payment-methods',
          question: 'Welche Zahlungsmethoden werden akzeptiert?',
          answer: 'Aktuell erfolgt die Zahlung per Überweisung nach Rechnungsstellung. Sie erhalten nach Auftragsabschluss eine Rechnung per Email mit allen Zahlungsinformationen (IBAN, BIC, Verwendungszweck). Das Zahlungsziel beträgt 14 Tage ab Rechnungsdatum.'
        },
        {
          id: 'invoice-receipt',
          question: 'Wann erhalte ich meine Rechnung?',
          answer: 'Rechnungen werden nach Auftragsabschluss erstellt und automatisch per Email versendet. Sie können Ihre Rechnungen auch jederzeit in Ihrem Dashboard unter "Abrechnung" einsehen und als PDF herunterladen.'
        },
        {
          id: 'invoice-details',
          question: 'Was steht auf der Rechnung?',
          answer: 'Ihre Rechnung enthält: Rechnungsnummer, Datum, Fälligkeitsdatum (Datum + 14 Tage), Ihre vollständigen Firmendaten (falls hinterlegt), detaillierte Leistungsübersicht mit Route, Transportkosten, Wartezeit-Gebühren (falls zutreffend), Nettobetrag, 19% MwSt., Gesamtbetrag und Zahlungsinformationen.'
        },
        {
          id: 'vat',
          question: 'Wie wird die Mehrwertsteuer berechnet?',
          answer: 'Alle Preise verstehen sich zzgl. 19% MwSt. (Regelsteuersatz). Auf Ihrer Rechnung werden Nettobetrag, Mehrwertsteuer und Bruttobetrag separat ausgewiesen. Firmenkunden mit USt-IdNr können ggf. von der Reverse-Charge-Regelung profitieren.'
        },
        {
          id: 'company-data',
          question: 'Wie hinterlege ich meine Firmendaten für Rechnungen?',
          answer: 'Gehen Sie zu "Einstellungen" und aktivieren Sie den "Firma"-Toggle. Geben Sie Firmenname, Adresse, PLZ, Stadt, Steuernummer und USt-IdNr ein. Diese Daten werden automatisch für alle Rechnungen verwendet und in Aufträgen vorausgefüllt.'
        }
      ]
    },
    {
      id: 'documents',
      title: 'Dokumente & CMR',
      icon: FileText,
      color: 'bg-purple-500',
      questions: [
        {
          id: 'what-is-cmr',
          question: 'Was ist ein CMR-Frachtbrief?',
          answer: 'Der CMR-Frachtbrief ist ein internationales Transportdokument, das alle Details des Transports enthält (Absender, Empfänger, Ware, Route). Er dient als Nachweis für die Durchführung des Transports und enthält die Unterschriften von Absender, Frachtführer und Empfänger.'
        },
        {
          id: 'cmr-creation',
          question: 'Wann wird der CMR erstellt?',
          answer: 'Der CMR wird automatisch erstellt, sobald ein Administrator eine Bewerbung akzeptiert und den Auftrag einem Auftragnehmer zuweist. Sie erhalten den CMR als PDF per Email und können ihn jederzeit in Ihrem Dashboard einsehen.'
        },
        {
          id: 'digital-signatures',
          question: 'Wie funktionieren die digitalen Unterschriften?',
          answer: 'Bei Abholung unterschreibt der Absender auf dem Smartphone/Tablet des Fahrers. Bei Zustellung unterschreibt der Empfänger. Alle Unterschriften werden im CMR gespeichert und sind rechtsgültig. Nach Zustellung erhalten Sie den finalisierten CMR mit allen Unterschriften per Email.'
        },
        {
          id: 'download-documents',
          question: 'Wo finde ich meine Dokumente?',
          answer: 'Alle Dokumente (CMR, Rechnungen) finden Sie in Ihrem Dashboard. Klicken Sie auf einen Auftrag, um Details und Dokumente anzuzeigen. Sie können alle Dokumente als PDF herunterladen. Zusätzlich erhalten Sie alle wichtigen Dokumente automatisch per Email.'
        }
      ]
    },
    {
      id: 'contractors',
      title: 'Für Auftragnehmer',
      icon: Shield,
      color: 'bg-indigo-500',
      questions: [
        {
          id: 'contractor-requirements',
          question: 'Welche Voraussetzungen muss ich als Auftragnehmer erfüllen?',
          answer: 'Sie benötigen: Eine gültige Gewerbeanmeldung, eine Transportversicherung (Nachweis als PDF), ein Fahrzeug für Transporte, und die Bereitschaft, Mindestlohn-Regelungen einzuhalten. Nach der Registrierung müssen Sie diese Dokumente hochladen und werden von unserem Team verifiziert.'
        },
        {
          id: 'verification-process',
          question: 'Wie läuft die Verifizierung ab?',
          answer: 'Nach der Registrierung gehen Sie zu "Verifizierung" und laden Ihre Gewerbeanmeldung und Transportversicherung hoch (PDF, max. 5 MB). Bestätigen Sie die Mindestlohn-Erklärung. Unser Admin-Team prüft Ihre Dokumente innerhalb von 24-48 Stunden. Sie erhalten eine Email über die Freigabe oder Ablehnung.'
        },
        {
          id: 'bidding-process',
          question: 'Wie bewerbe ich mich auf Aufträge?',
          answer: 'Nach erfolgreicher Verifizierung sehen Sie verfügbare Aufträge in Ihrem Dashboard. Sie sehen zunächst nur die PLZ (Datenschutz). Klicken Sie auf "Bewerben", geben Sie Ihren Preis ein (max. 85% des Kundenpreises) und senden Sie die Bewerbung. Bei Akzeptanz erhalten Sie alle Details und den CMR.'
        },
        {
          id: 'contractor-pricing',
          question: 'Wie viel verdiene ich als Auftragnehmer?',
          answer: 'Sie erhalten 85% des Kundenpreises (15% Plattform-Provision). Beispiel: Kunde zahlt €100 → Sie erhalten €85. Bei Wartezeit-Gebühren erhalten Sie ebenfalls 85%. Die Abrechnung erfolgt nach Auftragsabschluss.'
        },
        {
          id: 'employee-management',
          question: 'Kann ich Mitarbeiter hinzufügen?',
          answer: 'Ja! Als Auftragnehmer können Sie Mitarbeiter anlegen und diesen Aufträge zuweisen. Mitarbeiter sehen nur ihre zugewiesenen Aufträge und keine Preise (Datenschutz). Sie verwalten alle Mitarbeiter-Aufträge in Ihrem Dashboard.'
        },
        {
          id: 'notifications',
          question: 'Wie werde ich über neue Aufträge informiert?',
          answer: 'Sie können PLZ-basierte Benachrichtigungen konfigurieren. Wenn ein neuer Auftrag in Ihrer Region erstellt wird, erhalten Sie eine Email-Benachrichtigung. So verpassen Sie keine Aufträge in Ihrem Gebiet.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Support & Kontakt',
      icon: Mail,
      color: 'bg-pink-500',
      questions: [
        {
          id: 'contact-support',
          question: 'Wie kann ich den Support kontaktieren?',
          answer: 'Sie erreichen uns per Email unter info@courierly.de oder telefonisch unter +49 (0)172 421 66 72. Unser Support-Team ist Montag bis Freitag von 9:00 bis 18:00 Uhr für Sie da. In dringenden Fällen nutzen Sie bitte die Telefon-Hotline.'
        },
        {
          id: 'response-time',
          question: 'Wie schnell erhalte ich eine Antwort?',
          answer: 'Wir bemühen uns, alle Anfragen innerhalb von 24 Stunden zu beantworten. Bei dringenden Fällen (z.B. Probleme während eines laufenden Transports) kontaktieren Sie uns bitte telefonisch für sofortige Hilfe.'
        },
        {
          id: 'technical-issues',
          question: 'Was mache ich bei technischen Problemen?',
          answer: 'Versuchen Sie zunächst, die Seite neu zu laden (F5) oder sich aus- und wieder einzuloggen. Löschen Sie ggf. Ihren Browser-Cache. Wenn das Problem weiterhin besteht, kontaktieren Sie unseren Support mit einer detaillierten Beschreibung des Problems und Screenshots.'
        },
        {
          id: 'feedback',
          question: 'Kann ich Feedback oder Verbesserungsvorschläge einreichen?',
          answer: 'Ja, sehr gerne! Wir freuen uns über Ihr Feedback. Senden Sie uns Ihre Vorschläge, Kritik oder Lob per Email an info@courierly.de. Ihr Feedback hilft uns, Courierly kontinuierlich zu verbessern.'
        }
      ]
    },
    {
      id: 'features',
      title: 'Besondere Features',
      icon: Clock,
      color: 'bg-teal-500',
      questions: [
        {
          id: 'auto-refresh',
          question: 'Aktualisiert sich das Dashboard automatisch?',
          answer: 'Ja! Das Admin-Dashboard aktualisiert sich automatisch alle 60 Sekunden. So sehen Sie immer die neuesten Aufträge, Bewerbungen und Status-Updates ohne manuelles Neuladen. Ihre aktuelle Position (Tab) bleibt dabei erhalten.'
        },
        {
          id: 'position-persistence',
          question: 'Bleibe ich nach einem Reload auf der gleichen Seite?',
          answer: 'Ja! Wenn Sie im Admin-Dashboard sind und die Seite neu laden, bleiben Sie auf dem gleichen Tab (z.B. "Aufträge", "Kunden", "Abrechnung"). Ihre Position wird automatisch gespeichert und wiederhergestellt.'
        },
        {
          id: 'address-autocomplete',
          question: 'Wie funktioniert die Adress-Suche?',
          answer: 'Unsere Adress-Suche nutzt OpenStreetMap Nominatim für präzise Autocomplete-Vorschläge. Beginnen Sie mit der Eingabe einer Adresse und wählen Sie aus den Vorschlägen. Die Koordinaten werden automatisch ermittelt für die Routenberechnung.'
        },
        {
          id: 'route-visualization',
          question: 'Kann ich die Route auf einer Karte sehen?',
          answer: 'Ja! Bei der Auftragserstellung sehen Sie die Route auf einer interaktiven Karte (Leaflet.js mit OpenStreetMap). Die Route wird mit OSRM berechnet und zeigt die tatsächliche Fahrstrecke, nicht nur eine Luftlinie. Sie sehen auch Distanz und geschätzte Fahrzeit.'
        },
        {
          id: 'minimum-wage',
          question: 'Was ist die Mindestlohn-Garantie?',
          answer: 'Wir garantieren, dass alle Preise den Mindestlohn für Fahrer einhalten. Die Berechnung basiert auf Distanz (€/km) und Fahrzeit (€/Stunde). Wenn Sie einen Preis eingeben, der den Mindestlohn unterschreitet, erhalten Sie eine Warnung und können den Auftrag nicht erstellen. Dies schützt Fahrer vor Ausbeutung.'
        },
        {
          id: 'smart-defaults',
          question: 'Was sind "Smart Defaults"?',
          answer: 'Um Ihnen Zeit zu sparen, füllen wir häufig verwendete Felder automatisch aus: Europalette-Maße (120×80×15cm), Standardgewicht (100kg), Direktfahrt (gleicher Tag), Ihre Firmendaten (wenn hinterlegt). Sie können alle Werte jederzeit anpassen.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Häufig gestellte Fragen
            </h1>
            <p className="text-xl text-sky-100 max-w-3xl mx-auto">
              Finden Sie Antworten auf die wichtigsten Fragen zu Courierly. 
              Von der Registrierung bis zur Rechnungsstellung – wir helfen Ihnen weiter.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategorien</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`${category.color} text-white p-4 rounded-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-lg`}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-center">
                    {category.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            const isOpen = openCategory === category.id;

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${category.color} p-2 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({category.questions.length} Fragen)
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200">
                    {category.questions.map((q, index) => {
                      const isQuestionOpen = openQuestion === q.id;
                      
                      return (
                        <div
                          key={q.id}
                          className={`${
                            index !== 0 ? 'border-t border-gray-100' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleQuestion(q.id)}
                            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 pr-8">
                                {q.question}
                              </h4>
                              {isQuestionOpen ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </button>
                          
                          {isQuestionOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-700 leading-relaxed">
                                {q.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl p-8 text-white text-center">
          <Mail className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Ihre Frage wurde nicht beantwortet?
          </h2>
          <p className="text-sky-100 mb-6">
            Unser Support-Team hilft Ihnen gerne weiter!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@courierly.de"
              className="bg-white text-sky-600 px-6 py-3 rounded-lg font-semibold hover:bg-sky-50 transition-colors inline-flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              info@courierly.de
            </a>
            <a
              href="tel:+4917242166672"
              className="bg-white text-sky-600 px-6 py-3 rounded-lg font-semibold hover:bg-sky-50 transition-colors inline-flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              +49 (0)172 421 66 72
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
