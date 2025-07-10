// src/types/index.ts
import { Language } from '../i18n';

// Core data structures
export interface Character {
  id?: string;
  name: string;
  lineCount: number;
  isSelected?: boolean;
  voiceSettings?: VoiceSettings;
}

export interface ScriptLine {
  id: string;
  character: string;
  text: string;
  lineNumber: number;
  direction?: string;
  actNumber?: number;
  sceneNumber?: number;
}

export interface UserProgress {
  scriptId: string;
  character: string;
  completedLines: number[];
  accuracyScores: { [key: number]: number };
}

// Settings and configurations
export type AccuracyLevel = 'exact' | 'semantic' | 'loose';

export interface VoiceSettings {
  rate: number;
  volume: number;
  voiceIndex: number;
}

export interface AppSettings {
  accuracyLevel: AccuracyLevel;
  voiceSettings: VoiceSettings;
  language: Language;
  autoAdvance: boolean;
  autoRecordTimeout: number;
  deviceId: string;
  theme?: 'light' | 'dark' | 'system';
}

// Language information
export interface ScriptLanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechCode: string;
}

export const SCRIPT_LANGUAGES: ScriptLanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', speechCode: 'it-IT' },
];

export const getScriptLanguageInfo = (code: string): ScriptLanguageInfo => {
  return SCRIPT_LANGUAGES.find(lang => lang.code === code) || SCRIPT_LANGUAGES[0];
};