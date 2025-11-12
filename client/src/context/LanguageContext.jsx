import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'de';
  });
  const [easyLanguage, setEasyLanguage] = useState(() => {
    return localStorage.getItem('easyLanguage') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('easyLanguage', easyLanguage);
  }, [easyLanguage]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  const toggleEasyLanguage = () => {
    setEasyLanguage(prev => !prev);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      toggleLanguage,
      easyLanguage,
      toggleEasyLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
