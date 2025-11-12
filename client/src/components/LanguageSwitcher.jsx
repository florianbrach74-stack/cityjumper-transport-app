import { useLanguage } from '../context/LanguageContext';
import { Globe, Languages, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { language, setLanguage, easyLanguage, toggleEasyLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Sprache wechseln"
      >
        <Globe className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang.flag} {currentLang.code.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
          {/* Language Options */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Sprache / Language
            </p>
          </div>
          
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                language === lang.code ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className={`font-medium ${
                  language === lang.code ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {lang.name}
                </span>
              </div>
              {language === lang.code && (
                <Check className="h-5 w-5 text-primary-600" />
              )}
            </button>
          ))}

          {/* Easy Language Toggle (only for German) */}
          {language === 'de' && (
            <>
              <div className="px-3 py-2 border-t border-b border-gray-100 mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Barrierefreiheit
                </p>
              </div>
              
              <button
                onClick={toggleEasyLanguage}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Languages className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-700">Leichte Sprache</p>
                    <p className="text-xs text-gray-500">Einfacher zu verstehen</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  easyLanguage ? 'bg-primary-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${
                    easyLanguage ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
