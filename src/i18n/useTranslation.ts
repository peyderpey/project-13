import { useContext } from 'react';
import { I18nContext } from './I18nProvider';
import translations from './translations';

export const useTranslation = () => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { language } = context;
  
  // Get translations for current language with fallback to English
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    
    // Navigate through nested object
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) break;
    }
    
    // Fallback to English if translation not found
    if (value === undefined) {
      value = translations.en;
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
        if (value === undefined) break;
      }
    }
    
    // Return key if no translation found
    return (value as string) || key;
  };

  // Helper function for pluralization
  const tp = (key: string, count: number, singular?: string, plural?: string): string => {
    if (singular && plural) {
      return count === 1 ? singular : plural;
    }
    
    const translation = t(key);
    return `${count} ${translation}`;
  };

  // Helper function for interpolation
  const ti = (key: string, values: Record<string, string | number>): string => {
    let translation = t(key);
    
    Object.entries(values).forEach(([placeholder, value]) => {
      translation = translation.replace(`{{${placeholder}}}`, String(value));
    });
    
    return translation;
  };

  return {
    t,
    tp,
    ti,
    ...context
  };
};