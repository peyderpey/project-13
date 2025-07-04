import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Mic, 
  Eye, 
  EyeOff,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Volume2,
  ArrowRight,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Book,
  FileText,
  ChevronDown
} from 'lucide-react';
import { ScriptLine, AccuracyLevel, VoiceSettings, Character, UserProgress } from '../types';
import { calculateAccuracy } from '../utils/scriptParser';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import PracticeHeader from './PracticeHeader';
import PracticeFooter from './PracticeFooter';

// 🔥 FIX: Clear, generous timeout for actors with dramatic timing needs
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000; // 1 second for countdown updates

type PracticeMode = 'auto' | 'manual';
type HideLevel = 'show-all' | 'hide-25' | 'hide-50' | 'hide-75' | 'hide-all';

interface PracticeSessionProps {
  lines: ScriptLine[];
  characters: Character[];
  selectedCharacter: string;
  scriptTitle: string;
  scriptLanguage: string;
  accuracyLevel: AccuracyLevel;
  voiceSettings: VoiceSettings;
  language: string;
  autoRecordTimeout: number;
  startingLineIndex: number;
  practiceMode: PracticeMode;
  onBack: () => void;
  onProgressUpdate: (progress: UserProgress) => void;
  // Speech synthesis props
  voices: SpeechSynthesisVoice[];
  speak: (text: string, settings: VoiceSettings, language?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  // Speech recognition props
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  speechRecognitionSupported: boolean;
  isSpeechDetected: boolean;
}

export const PracticeSessionUI: React.FC<PracticeSessionProps> = (props) => {
// ...
// (Full content of PracticeSession.tsx, replacing 'export const PracticeSession' with 'export const PracticeSessionUI', and using 'props' instead of destructuring in the function signature)
// ...
} 