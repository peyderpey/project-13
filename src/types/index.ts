import { Language } from '../i18n';

export interface Character {
  id?: string; // character_id from database
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
  type?: 'dialogue' | 'direction' | 'setting' | 'character';
  actNumber?: number;
  sceneNumber?: number;
  actTitle?: string;
  sceneTitle?: string;
}

export interface PracticeSession {
  id: string;
  scriptTitle: string;
  selectedCharacter: string;
  lines: ScriptLine[];
  currentLineIndex: number;
  accuracy: number;
  completedLines: number;
}

export interface UserProgress {
  scriptId: string;
  character: string;
  lastActNumber: number;
  lastSceneNumber: number;
  lastLineIndex: number;
  completedLines: number[];
  accuracyScores: { [key: number]: number };
}

export interface CharacterPerformance {
  scriptId: string;
  character: string;
  lastPlayed: string; // ISO date string
  averageAccuracy: number;
  recentScores: number[]; // Last 5 scores, most recent first
  totalSessions: number;
}

export interface ScriptCharacterHistory {
  scriptId: string;
  lastSelectedCharacter: string;
  lastPlayed: string; // ISO date string
}

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
  autoRecordTimeout: number; // seconds to wait before showing line
  deviceId: string; // unique identifier for the device
  progress?: { [key: string]: UserProgress };
  characterPerformance?: { [key: string]: CharacterPerformance }; // scriptId-character key
  scriptHistory?: { [key: string]: ScriptCharacterHistory }; // scriptId key
  // Temporary flag for testing new practice session
  useNewPracticeSession?: boolean;
}

// Script Language Information
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
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', speechCode: 'pt-PT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', speechCode: 'zh-CN' }
];

export const getScriptLanguageInfo = (code: string): ScriptLanguageInfo => {
  return SCRIPT_LANGUAGES.find(lang => lang.code === code) || SCRIPT_LANGUAGES[0];
};

// Enhanced script structure types
export interface ScriptStructure {
  title: string;
  cast?: string[];
  setting?: string;
  acts: Act[];
  metadata?: {
    author?: string;
    genre?: string;
    year?: string;
  };
}

export interface Act {
  act: string;
  actNumber: number;
  scenes: Scene[];
}

export interface Scene {
  scene: string;
  sceneNumber: number;
  actNumber: number;
  setting?: string;
  atRise?: string;
  lines: ParsedLine[];
}

export interface ParsedLine {
  id: string;
  type: 'dialogue' | 'direction' | 'character' | 'setting' | 'shared';
  character?: string | string[];
  text?: string;
  direction?: string;
  lineNumber: number;
}

export type ContentType = 
  | 'title'
  | 'cast'
  | 'setting'
  | 'act'
  | 'scene'
  | 'character'
  | 'dialogue'
  | 'direction'
  | 'shared'
  | 'simultaneous'
  | 'unknown';

export interface ClassifiedLine {
  type: ContentType;
  content: string;
  confidence: number;
  metadata?: {
    characters?: string[];
    isShared?: boolean;
    isSimultaneous?: boolean;
    indentation?: number;
    formatting?: string;
  };
}

// Legacy support - keeping for backward compatibility
export type SupportedLanguage = 'tr-TR' | 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR' | 'es-ES' | 'it-IT';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' }
];