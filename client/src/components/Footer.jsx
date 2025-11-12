import { Link } from 'react-router-dom';
import { FileText, Scale, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-2">
              Courierly
            </h3>
            <p className="text-sm text-gray-500 italic mb-4">
              eine Marke der FB Transporte
            </p>
            <p className="text-gray-400 mb-4">
              Schneller Kurierdienst & Express-Transport in Berlin und deutschlandweit
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-500" />
                <span>Adolf-Menzel-Straße 71, 12621 Berlin</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary-500" />
                <a href="tel:+4917242166672" className="hover:text-white">+49 (0)172 421 66 72</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-500" />
                <a href="mailto:info@courierly.de" className="hover:text-white">info@courierly.de</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Schnellzugriff</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Anmelden
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Registrieren
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-white transition-colors">
                  Funktionen
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">
                  Preise
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/agb" 
                  className="flex items-center space-x-2 hover:text-white transition-colors group"
                >
                  <FileText className="h-4 w-4 text-primary-500 group-hover:text-primary-400" />
                  <span>AGB</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/widerruf" 
                  className="flex items-center space-x-2 hover:text-white transition-colors group"
                >
                  <Scale className="h-4 w-4 text-primary-500 group-hover:text-primary-400" />
                  <span>Widerrufsbelehrung</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.florianbrach.com/datenschutz" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Datenschutz
                </a>
              </li>
              <li>
                <a 
                  href="https://www.florianbrach.com/impressum" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Impressum
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p className="text-gray-400 mb-2">
            <strong>Courierly</strong> – eine Marke der <strong>FB Transporte</strong>, Inhaber: Florian Brach
          </p>
          <p className="text-gray-500">
            Adolf-Menzel-Straße 71 · 12621 Berlin · Tel: +49 (0)172 421 66 72 · info@courierly.de · www.courierly.de
          </p>
          <p className="text-gray-500 mt-2">
            USt-IdNr.: DE299198928 · St.-Nr.: 33/237/00521
          </p>
          <p className="text-gray-600 mt-3 text-xs">
            © {new Date().getFullYear()} Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
