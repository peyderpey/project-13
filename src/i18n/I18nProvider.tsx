import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Language, detectBrowserLanguage, getLanguageInfo } from './index';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language from localStorage
    const saved = localStorage.getItem('rehearsify-language');
    if (saved && ['en', 'tr', 'de', 'fr', 'es', 'it'].includes(saved)) {
      return saved as Language;
    }
    // Fallback to browser detection
    return detectBrowserLanguage();
  });

  const [isRTL] = useState(false); // None of our supported languages are RTL

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('rehearsify-language', newLanguage);
    
    // Update document language attribute
    document.documentElement.lang = getLanguageInfo(newLanguage).speechCode;
  };

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = getLanguageInfo(language).speechCode;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    isRTL
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};