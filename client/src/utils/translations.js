// Translation utility
export const translations = {
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.login': 'Anmelden',
    'nav.register': 'Registrieren',
    'nav.logout': 'Abmelden',
    'nav.dashboard': 'Dashboard',
    
    // Hero Section
    'hero.title': 'Express Transport leicht gemacht',
    'hero.subtitle': 'Ihr zuverlässiger Partner für schnelle Kurierdienste und Eiltransporte in ganz Deutschland',
    'hero.badge': 'Blitzschnell & Zuverlässig',
    'hero.cta.calculate': 'Preis berechnen',
    'hero.cta.register': 'Kostenlos registrieren',
    'hero.stats.transports': 'Transporte/Monat',
    'hero.stats.available': 'Verfügbar',
    'hero.stats.satisfaction': 'Zufriedenheit',
    
    // Features
    'features.title': 'Warum Courierly?',
    'features.express.title': 'Express-Lieferung',
    'features.express.desc': 'Schnelle Zustellung innerhalb von Stunden',
    'features.insured.title': 'Versichert',
    'features.insured.desc': 'Vollständig versicherte Transporte',
    'features.nationwide.title': 'Deutschlandweit',
    'features.nationwide.desc': 'Lieferung in ganz Deutschland',
    'features.fair.title': 'Faire Preise',
    'features.fair.desc': 'Transparente und günstige Preise',
    
    // Calculator
    'calc.title': 'Preis berechnen',
    'calc.pickup': 'Abholadresse',
    'calc.delivery': 'Lieferadresse',
    'calc.vehicle': 'Fahrzeugtyp',
    'calc.calculate': 'Preis berechnen',
    'calc.price': 'Empfohlener Preis',
    'calc.order': 'Jetzt bestellen',
    
    // Footer
    'footer.contact': 'Kontakt',
    'footer.legal': 'Rechtliches',
    'footer.agb': 'AGB',
    'footer.privacy': 'Datenschutz',
    'footer.imprint': 'Impressum',
    
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
  },
  
  de_easy: {
    // Leichte Sprache
    'nav.home': 'Start-Seite',
    'nav.login': 'Anmelden',
    'nav.register': 'Neu anmelden',
    'nav.logout': 'Abmelden',
    'nav.dashboard': 'Meine Seite',
    
    'hero.title': 'Schneller Transport. Einfach gemacht.',
    'hero.subtitle': 'Wir bringen Ihre Sachen schnell von A nach B. In ganz Deutschland.',
    'hero.badge': 'Sehr schnell und sicher',
    'hero.cta.calculate': 'Was kostet es?',
    'hero.cta.register': 'Kostenlos anmelden',
    'hero.stats.transports': 'Fahrten pro Monat',
    'hero.stats.available': 'Immer da',
    'hero.stats.satisfaction': 'Zufriedene Kunden',
    
    'features.title': 'Warum Courierly gut ist',
    'features.express.title': 'Sehr schnell',
    'features.express.desc': 'Wir liefern in wenigen Stunden',
    'features.insured.title': 'Sicher',
    'features.insured.desc': 'Ihre Sachen sind versichert',
    'features.nationwide.title': 'Überall',
    'features.nationwide.desc': 'Wir liefern in ganz Deutschland',
    'features.fair.title': 'Guter Preis',
    'features.fair.desc': 'Nicht zu teuer. Klar und einfach.',
    
    'calc.title': 'Preis berechnen',
    'calc.pickup': 'Von wo?',
    'calc.delivery': 'Wo hin?',
    'calc.vehicle': 'Welches Auto?',
    'calc.calculate': 'Preis zeigen',
    'calc.price': 'Das kostet es',
    'calc.order': 'Jetzt bestellen',
    
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.success': 'Gut!',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Ändern',
    'common.close': 'Schließen',
  },
  
  en: {
    // English
    'nav.home': 'Home',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    
    'hero.title': 'Express Transport Made Easy',
    'hero.subtitle': 'Your reliable partner for fast courier services and express transport throughout Germany',
    'hero.badge': 'Lightning Fast & Reliable',
    'hero.cta.calculate': 'Calculate Price',
    'hero.cta.register': 'Register for Free',
    'hero.stats.transports': 'Transports/Month',
    'hero.stats.available': 'Available',
    'hero.stats.satisfaction': 'Satisfaction',
    
    'features.title': 'Why Courierly?',
    'features.express.title': 'Express Delivery',
    'features.express.desc': 'Fast delivery within hours',
    'features.insured.title': 'Insured',
    'features.insured.desc': 'Fully insured transports',
    'features.nationwide.title': 'Nationwide',
    'features.nationwide.desc': 'Delivery throughout Germany',
    'features.fair.title': 'Fair Prices',
    'features.fair.desc': 'Transparent and affordable prices',
    
    'calc.title': 'Calculate Price',
    'calc.pickup': 'Pickup Address',
    'calc.delivery': 'Delivery Address',
    'calc.vehicle': 'Vehicle Type',
    'calc.calculate': 'Calculate Price',
    'calc.price': 'Recommended Price',
    'calc.order': 'Order Now',
    
    'footer.contact': 'Contact',
    'footer.legal': 'Legal',
    'footer.agb': 'Terms',
    'footer.privacy': 'Privacy',
    'footer.imprint': 'Imprint',
    
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
  }
};

export const t = (key, language = 'de', easyLanguage = false) => {
  const lang = easyLanguage && language === 'de' ? 'de_easy' : language;
  return translations[lang]?.[key] || translations['de']?.[key] || key;
};
