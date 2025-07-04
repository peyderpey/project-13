export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'it';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', speechCode: 'it-IT' }
];

export const getLanguageInfo = (code: Language): LanguageInfo => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
};

export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  // Check for exact matches first
  for (const lang of SUPPORTED_LANGUAGES) {
    if (browserLang === lang.speechCode.toLowerCase()) {
      return lang.code;
    }
  }
  
  // Check for language prefix matches
  const langPrefix = browserLang.split('-')[0];
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.code === langPrefix) {
      return lang.code;
    }
  }
  
  // Default to English
  return 'en';
};