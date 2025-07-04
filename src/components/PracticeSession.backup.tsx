import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Mic, 
  RotateCcw,
  Clock,
  Volume2,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Book,
  FileText
} from 'lucide-react';
import { ScriptLine, AccuracyLevel, VoiceSettings, Character, UserProgress } from '../types';
import { calculateAccuracy } from '../utils/scriptParser';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import PracticeHeader from './PracticeHeader';
import PracticeFooter from './PracticeFooter';

// Constants
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000;

// Types
type PracticeMode = 'auto' | 'manual';
type HideLevel = 'show-all' | 'hide-25' | 'hide-50' | 'hide-75' | 'hide-all';

interface PracticeSessionProps {
  lines: ScriptLine[];
  characters: Character[];
  selectedCharacter: string;
  scriptTitle: string;
  accuracyLevel: AccuracyLevel;
  voiceSettings: VoiceSettings;
  language: string;
  autoRecordTimeout: number;
  startingLineIndex: number;
  practiceMode: PracticeMode;
  onBack: () => void;
  onProgressUpdate: (progress: UserProgress) => void;
  // Speech synthesis props
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

// Custom hook for practice session state management
const usePracticeSessionState = (
  lines: ScriptLine[],
  selectedCharacter: string,
  startingLineIndex: number,
  practiceMode: PracticeMode
) => {
  const [currentGlobalLineIndex, setCurrentGlobalLineIndex] = useState(startingLineIndex);
  const [isAutoMode, setIsAutoMode] = useState(practiceMode === 'auto');
  const [completedLines, setCompletedLines] = useState<Set<number>>(new Set());
  const [accuracyScores, setAccuracyScores] = useState<{ [key: number]: number }>({});
  const [hideLevel, setHideLevel] = useState<HideLevel>('show-all');
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [waitingForSpeech, setWaitingForSpeech] = useState(false);
  const [speechStarted, setSpeechStarted] = useState(false);
  const [playedLines, setPlayedLines] = useState<Set<number>>(new Set());
  const [showHideDropdown, setShowHideDropdown] = useState(false);

  // Derived state
  const currentLine = useMemo(() => lines[currentGlobalLineIndex], [lines, currentGlobalLineIndex]);
  const isMyLine = useMemo(() => currentLine?.character === selectedCharacter, [currentLine, selectedCharacter]);
  
  const myLines = useMemo(() => 
    lines.filter(line => line.character === selectedCharacter),
    [lines, selectedCharacter]
  );

  const myLineIndex = useMemo(() => 
    isMyLine ? myLines.findIndex(line => line.id === currentLine.id) : -1,
    [isMyLine, myLines, currentLine]
  );
  
  const progress = useMemo(() => 
    myLines.length > 0 ? (completedLines.size / myLines.length) * 100 : 0,
    [myLines.length, completedLines.size]
  );

  return {
    // State
    currentGlobalLineIndex,
    setCurrentGlobalLineIndex,
    isAutoMode,
    setIsAutoMode,
    completedLines,
    setCompletedLines,
    accuracyScores,
    setAccuracyScores,
    hideLevel,
    setHideLevel,
    timeoutCountdown,
    setTimeoutCountdown,
    isWaitingForUser,
    setIsWaitingForUser,
    showingResult,
    setShowingResult,
    waitingForSpeech,
    setWaitingForSpeech,
    speechStarted,
    setSpeechStarted,
    playedLines,
    setPlayedLines,
    showHideDropdown,
    setShowHideDropdown,
    // Derived state
    currentLine,
    isMyLine,
    myLines,
    myLineIndex,
    progress
  };
};

// Custom hook for timeout management
const useTimeoutManager = () => {
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const clearAllTimeouts = useCallback(() => {
    const count = timeoutIdsRef.current.length;
    if (count > 0) {
      console.log(`🧹 Clearing ${count} timeouts`);
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    }
    
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (speechRecoveryTimeoutRef.current) {
      clearTimeout(speechRecoveryTimeoutRef.current);
      speechRecoveryTimeoutRef.current = null;
    }
  }, []);

  return {
    timeoutIdsRef,
    userTimeoutRef,
    countdownIntervalRef,
    speechRecoveryTimeoutRef,
    addTimeout,
    clearAllTimeouts
  };
};

// Custom hook for progress management
const useProgressManager = (
  scriptTitle: string,
  selectedCharacter: string,
  currentGlobalLineIndex: number,
  completedLines: Set<number>,
  accuracyScores: { [key: number]: number },
  lines: ScriptLine[],
  user: any
) => {
  const progressKeyRef = useRef(`${scriptTitle}-${selectedCharacter}`);
  const isMountedRef = useRef(true);

  const saveProgressToLocalStorage = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (!lines || lines.length === 0 || currentGlobalLineIndex < 0 || currentGlobalLineIndex >= lines.length || !selectedCharacter) {
      console.warn('Cannot save progress: currentLine or selectedCharacter is invalid.');
      return;
    }
    
    try {
      const currentLineToSave = lines[currentGlobalLineIndex];
      const progress: UserProgress = {
        scriptId: scriptTitle,
        character: selectedCharacter,
        lastActNumber: currentLineToSave?.actNumber || 1,
        lastSceneNumber: currentLineToSave?.sceneNumber || 1,
        lastLineIndex: currentGlobalLineIndex,
        completedLines: Array.from(completedLines),
        accuracyScores: accuracyScores
      };
      
      localStorage.setItem(progressKeyRef.current, JSON.stringify(progress));
      console.log('Progress saved directly to localStorage');
      
      // Background sync to database (non-blocking and debounced)
      import('../utils/progressSync').then(({ syncProgressToDatabase }) => {
        syncProgressToDatabase(user?.id, scriptTitle, selectedCharacter, progress);
      }).catch(err => {
        console.log('Background sync not available:', err);
      });
    } catch (error) {
      console.error('Failed to save progress to localStorage:', error);
    }
  }, [scriptTitle, selectedCharacter, currentGlobalLineIndex, completedLines, accuracyScores, lines, user?.id]);

  return {
    progressKeyRef,
    isMountedRef,
    saveProgressToLocalStorage
  };
};

// Custom hook for voice settings
const useVoiceSettings = (characters: Character[], voiceSettings: VoiceSettings) => {
  const getCharacterVoiceSettings = useCallback((characterName: string): VoiceSettings => {
    const character = characters.find(c => c.name === characterName);
    
    return {
      rate: voiceSettings.rate,
      volume: voiceSettings.volume,
      voiceIndex: character?.voiceSettings?.voiceIndex ?? voiceSettings.voiceIndex
    };
  }, [characters, voiceSettings]);

  return { getCharacterVoiceSettings };
};

// Custom hook for word hiding
const useWordHiding = () => {
  const hiddenWordsMap = useRef<Map<string, Set<number>>>(new Map());

  const getHiddenWords = useCallback((text: string, lineId: string, hideLevel: HideLevel): Set<number> => {
    if (hideLevel === 'show-all') {
      return new Set();
    }
    
    if (hideLevel === 'hide-all') {
      const words = text.split(' ');
      return new Set(Array.from({ length: words.length }, (_, i) => i));
    }
    
    const cacheKey = `${lineId}-${hideLevel}`;
    if (!hiddenWordsMap.current.has(cacheKey)) {
      const words = text.split(' ');
      const totalWords = words.length;
      
      let hidePercentage = 0;
      switch (hideLevel) {
        case 'hide-25': hidePercentage = 0.25; break;
        case 'hide-50': hidePercentage = 0.5; break;
        case 'hide-75': hidePercentage = 0.75; break;
      }
      
      const wordsToHide = Math.floor(totalWords * hidePercentage);
      const hiddenIndices = new Set<number>();
      
      const availableIndices = words
        .map((word, index) => ({ word, index }))
        .filter(({ word }) => word.length > 2)
        .map(({ index }) => index);
      
      const shuffled = availableIndices.sort(() => Math.random() - 0.5);
      shuffled.slice(0, Math.min(wordsToHide, shuffled.length)).forEach(index => {
        hiddenIndices.add(index);
      });
      
      hiddenWordsMap.current.set(cacheKey, hiddenIndices);
    }
    
    return hiddenWordsMap.current.get(cacheKey) || new Set();
  }, []);

  return { getHiddenWords, hiddenWordsMap };
};

// Character colors utility
const useCharacterColors = (lines: ScriptLine[], selectedCharacter: string) => {
  const characterColors = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ];
    const characterMap: { [key: string]: string } = {};
    const uniqueCharacters = Array.from(new Set(lines.map(line => line.character)));
    
    uniqueCharacters.forEach((character, index) => {
      if (character === selectedCharacter) {
        characterMap[character] = 'bg-gradient-to-r from-purple-600 to-blue-600';
      } else {
        characterMap[character] = colors[index % colors.length];
      }
    });
    
    return characterMap;
  }, [lines, selectedCharacter]);

  return characterColors;
};

// Main component
export const PracticeSession: React.FC<PracticeSessionProps> = (props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Extract props
  const {
    lines,
    characters,
    selectedCharacter,
    scriptTitle,
    accuracyLevel,
    voiceSettings,
    language,
    autoRecordTimeout,
    startingLineIndex,
    practiceMode,
    onBack,
    onProgressUpdate,
    speak,
    stop,
    isSpeaking,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    speechRecognitionSupported,
    isSpeechDetected
  } = props;

  // Custom hooks
  const state = usePracticeSessionState(lines, selectedCharacter, startingLineIndex, practiceMode);
  const timeoutManager = useTimeoutManager();
  const progressManager = useProgressManager(
    scriptTitle,
    selectedCharacter,
    state.currentGlobalLineIndex,
    state.completedLines,
    state.accuracyScores,
    lines,
    user
  );
  const voiceSettingsHook = useVoiceSettings(characters, voiceSettings);
  const wordHiding = useWordHiding();
  const characterColors = useCharacterColors(lines, selectedCharacter);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const pendingAdvanceRef = useRef(false);

  // Performance calculation
  const overallPerformance = useMemo(() => {
    if (Object.keys(state.accuracyScores).length === 0) return 'Perfect';
    
    const scores = Object.values(state.accuracyScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 70) return 'Perfect';
    if (averageScore >= 40) return 'Not Bad';
    return 'Can Be Better';
  }, [state.accuracyScores]);

  // Continue with the rest of the component logic...
  // (I'll continue with the refactored version in the next part)

  // Load initial progress from localStorage on mount
  useEffect(() => {
    console.log('PracticeSession mounted - loading progress from localStorage');
    
    const savedProgress = localStorage.getItem(progressManager.progressKeyRef.current);
    if (savedProgress) {
      try {
        const progress: UserProgress = JSON.parse(savedProgress);
        if (Array.isArray(progress.completedLines)) {
          state.setCompletedLines(new Set(progress.completedLines));
        }
        if (progress.accuracyScores) {
          state.setAccuracyScores(progress.accuracyScores);
        }
        console.log('Loaded progress from localStorage:', {
          completedLines: progress.completedLines,
          accuracyScores: progress.accuracyScores
        });
      } catch (error) {
        console.error('Failed to parse saved progress:', error);
      }
    }

    // Auto-start practice based on practice mode
    if (practiceMode === 'auto') {
      console.log('AUTO MODE: Auto-starting practice session');
      const autoStartTimeout = setTimeout(() => {
        if (progressManager.isMountedRef.current) {
          startAutoMode();
        }
      }, 300);
      
      return () => {
        console.log('PracticeSession unmounting - final progress save');
        progressManager.isMountedRef.current = false;
        clearTimeout(autoStartTimeout);
        timeoutManager.clearAllTimeouts();
        stop();
        stopListening();
        progressManager.saveProgressToLocalStorage();
      };
    } else {
      console.log('MANUAL MODE: Ready for manual operation');
      const manualTTSTimeout = setTimeout(() => {
        if (progressManager.isMountedRef.current) {
          if (!state.isMyLine) {
            console.log('MANUAL MODE: Playing TTS for current line');
            playCurrentLineTTS();
          } else {
            handleManualLinePlay();
          }
        }
      }, 300);

      return () => {
        console.log('PracticeSession unmounting - final progress save');
        progressManager.isMountedRef.current = false;
        clearTimeout(manualTTSTimeout);
        timeoutManager.clearAllTimeouts();
        stop();
        stopListening();
        progressManager.saveProgressToLocalStorage();
      };
    }
  }, []); // Remove dependencies to avoid circular references

  // 🔥 FIX: Updated getCharacterVoiceSettings to prioritize global rate, volume
  const getCharacterVoiceSettings = useCallback((characterName: string): VoiceSettings => {
    const character = characters.find(c => c.name === characterName);
    
    // Always use global rate and volume from voiceSettings prop
    // Only use character-specific voiceIndex if available
    return {
      rate: voiceSettings.rate,        // Always use global rate
      volume: voiceSettings.volume,    // Always use global volume
      voiceIndex: character?.voiceSettings?.voiceIndex ?? voiceSettings.voiceIndex // Use character's voice type, fallback to global
    };
  }, [characters, voiceSettings]);

  // Helper function to play TTS for current line in manual mode
  const playCurrentLineTTS = useCallback(() => {
    if (state.currentLine && !state.isMyLine) {
      const characterVoiceSettings = getCharacterVoiceSettings(state.currentLine.character);
      speak(state.currentLine.text, characterVoiceSettings, language);
    }
  }, [state.currentLine, state.isMyLine, speak, language, getCharacterVoiceSettings]);

  // Helper functions
  const addTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    timeoutManager.addTimeout(timeoutId);
  }, [timeoutManager]);

  const clearAllTimeouts = useCallback(() => {
    timeoutManager.clearAllTimeouts();
  }, [timeoutManager]);

  // AUTOMATIC VOICE RECOGNITION: Always start listening for user lines in manual mode
  const handleManualLinePlay = useCallback(() => {
    if (state.isMyLine && speechRecognitionSupported) {
      console.log('🎤 Manual mode - starting voice recognition with actor-friendly timeout');
      state.setIsWaitingForUser(true);
      startListening();
      
      // Set up the same generous timeout for manual mode
      if (timeoutManager.userTimeoutRef.current) {
        clearTimeout(timeoutManager.userTimeoutRef.current);
      }
      
      console.log(`⏰ Manual mode: Setting up actor-friendly timeout: ${autoRecordTimeout} seconds`);
      timeoutManager.userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Manual mode timeout reached - generous time expired');
        stopListening();
        state.setIsWaitingForUser(false);
        state.setTimeoutCountdown(0);
        // In manual mode, don't auto-advance - just stop listening
      }, autoRecordTimeout * 1000);
    }
  }, [state.isMyLine, speechRecognitionSupported, startListening, stopListening, autoRecordTimeout, state.setIsWaitingForUser, state.setTimeoutCountdown]);

  const startAutoMode = useCallback(() => {
    console.log('🚀 Starting AUTO MODE with actor-friendly timing');
    
    resetTranscript();
    clearAllTimeouts();
    stop();
    stopListening();
    
    state.setIsWaitingForUser(false);
    state.setShowingResult(false);
    state.setWaitingForSpeech(false);
    state.setSpeechStarted(false);
    state.setTimeoutCountdown(0);
    state.setIsAutoMode(true);
    pendingAdvanceRef.current = false;
    
    const initialTimeout = setTimeout(() => {
      // Use a ref to avoid circular dependency
      if (processLineAtIndexRef.current) {
        processLineAtIndexRef.current(state.currentGlobalLineIndex);
      }
    }, 300);
    addTimeout(initialTimeout);
  }, [resetTranscript, clearAllTimeouts, stop, stopListening, state.setIsWaitingForUser, state.setShowingResult, state.setWaitingForSpeech, state.setSpeechStarted, state.setTimeoutCountdown, state.setIsAutoMode, addTimeout]);

  // 🔥 NEW: Enhanced hiding system with percentage-based word hiding
  const getHiddenWords = useCallback((text: string, lineId: string, hideLevel: HideLevel): Set<number> => {
    if (hideLevel === 'show-all') {
      return new Set();
    }
    
    if (hideLevel === 'hide-all') {
      const words = text.split(' ');
      return new Set(Array.from({ length: words.length }, (_, i) => i));
    }
    
    // For consistent hiding across renders, use cached results
    const cacheKey = `${lineId}-${hideLevel}`;
    if (!wordHiding.hiddenWordsMap.current.has(cacheKey)) {
      const words = text.split(' ');
      const totalWords = words.length;
      
      let hidePercentage = 0;
      switch (hideLevel) {
        case 'hide-25': hidePercentage = 0.25; break;
        case 'hide-50': hidePercentage = 0.5; break;
        case 'hide-75': hidePercentage = 0.75; break;
      }
      
      const wordsToHide = Math.floor(totalWords * hidePercentage);
      const hiddenIndices = new Set<number>();
      
      // Randomly select words to hide, but exclude very short words
      const availableIndices = words
        .map((word, index) => ({ word, index }))
        .filter(({ word }) => word.length > 2) // Don't hide very short words
        .map(({ index }) => index);
      
      // Shuffle and take the required number
      const shuffled = availableIndices.sort(() => Math.random() - 0.5);
      shuffled.slice(0, Math.min(wordsToHide, shuffled.length)).forEach(index => {
        hiddenIndices.add(index);
      });
      
      wordHiding.hiddenWordsMap.current.set(cacheKey, hiddenIndices);
    }
    
    return wordHiding.hiddenWordsMap.current.get(cacheKey) || new Set();
  }, [wordHiding]);

  const processLineAtIndex = useCallback((lineIndex: number) => {
    const line = lines[lineIndex];
    if (!line) {
      console.log('❌ No line to process');
      state.setIsAutoMode(false);
      return;
    }

    console.log(`🎬 Processing line ${lineIndex + 1}/${lines.length}: ${line.character} - "${line.text.substring(0, 50)}..."`);

    clearAllTimeouts();
    state.setIsWaitingForUser(false);
    state.setShowingResult(false);
    state.setWaitingForSpeech(false);
    state.setSpeechStarted(false);
    state.setTimeoutCountdown(0);
    resetTranscript();

    state.setPlayedLines(prev => new Set([...prev, lineIndex]));

    if (line.character === selectedCharacter) {
      console.log('🎤 User line - will be handled by consolidated useEffect');
      // The consolidated useEffect will handle this case
    } else {
      console.log('🗣️ Other character line - starting TTS');
      state.setWaitingForSpeech(true);
      state.setSpeechStarted(false);
      const characterVoiceSettings = getCharacterVoiceSettings(line.character);
      
      const ttsTimeout = setTimeout(() => {
        speak(line.text, characterVoiceSettings, language);
      }, 200);
      addTimeout(ttsTimeout);
      
      // Fallback timeout
      timeoutManager.speechRecoveryTimeoutRef.current = setTimeout(() => {
        console.log('🚨 Speech recovery timeout');
        if (state.waitingForSpeech && !isSpeaking) {
          state.setWaitingForSpeech(false);
          state.setSpeechStarted(false);
          if (state.isAutoMode) {
            // Use ref to avoid circular dependency
            if (moveToNextLineRef.current) {
              moveToNextLineRef.current();
            }
          }
        }
      }, 10000);
    }
  }, [lines, selectedCharacter, getCharacterVoiceSettings, speak, language, clearAllTimeouts, resetTranscript, addTimeout, state.waitingForSpeech, isSpeaking, state.isAutoMode, state.setWaitingForSpeech, state.setSpeechStarted]);

  const stopAutoMode = useCallback(() => {
    console.log('🛑 Stopping AUTO MODE');
    state.setIsAutoMode(false);
    pendingAdvanceRef.current = false;
    state.setIsWaitingForUser(false);
    state.setShowingResult(false);
    state.setWaitingForSpeech(false);
    state.setSpeechStarted(false);
    stop();
    stopListening();
    clearAllTimeouts();
    state.setTimeoutCountdown(0);
    
    // Save progress when stopping auto mode
    setTimeout(progressManager.saveProgressToLocalStorage, 100);
  }, [stop, stopListening, clearAllTimeouts, progressManager.saveProgressToLocalStorage, state.setIsAutoMode, state.setIsWaitingForUser, state.setShowingResult, state.setWaitingForSpeech, state.setSpeechStarted]);

  const handleManualNext = () => {
    if (state.currentGlobalLineIndex < lines.length - 1) {
      clearAllTimeouts();
      state.setShowingResult(false);
      if (moveToNextLineRef.current) {
        moveToNextLineRef.current();
      }
    }
  };

  const handleManualPrev = () => {
    if (state.currentGlobalLineIndex > 0) {
      clearAllTimeouts();
      stop();
      stopListening();
      
      state.setPlayedLines(prev => {
        const newPlayed = new Set(prev);
        newPlayed.delete(state.currentGlobalLineIndex - 1);
        return newPlayed;
      });
      
      state.setCurrentGlobalLineIndex(prev => prev - 1);
      state.setIsWaitingForUser(false);
      state.setShowingResult(false);
      state.setWaitingForSpeech(false);
      state.setSpeechStarted(false);
      resetTranscript();
      
      // Save progress on manual navigation
      setTimeout(progressManager.saveProgressToLocalStorage, 100);
    }
  };

  const handleRetryLine = () => {
    if (state.myLineIndex >= 0) {
      resetTranscript();
      state.setShowingResult(false);
      state.setAccuracyScores(prev => {
        const newScores = { ...prev };
        delete newScores[state.myLineIndex];
        return newScores;
      });
      state.setCompletedLines(prev => {
        const newCompleted = new Set(prev);
        newCompleted.delete(state.myLineIndex);
        return newCompleted;
      });
      
      // Save progress after retry
      setTimeout(progressManager.saveProgressToLocalStorage, 100);
      
      if (state.isMyLine && speechRecognitionSupported) {
        state.setIsWaitingForUser(true);
        startListening();
        // The consolidated timeout logic will handle this
      }
    }
  };

  // Enhanced moveToNextLine with progress saving
  const moveToNextLine = useCallback(() => {
    if (pendingAdvanceRef.current) {
      console.log('⚠️ Move already pending, skipping');
      return;
    }
    
    pendingAdvanceRef.current = true;
    console.log(`🚀 Moving to next line: ${state.currentGlobalLineIndex + 1} -> ${state.currentGlobalLineIndex + 2}`);
    
    // Save progress before moving
    progressManager.saveProgressToLocalStorage();
    
    if (state.currentGlobalLineIndex >= lines.length - 1) {
      console.log('🏁 End of script reached');
      state.setIsAutoMode(false);
      pendingAdvanceRef.current = false;
      return;
    }

    const nextLineIndex = state.currentGlobalLineIndex + 1;
    
    clearAllTimeouts();
    stop();
    stopListening();
    
    // Reset states
    state.setIsWaitingForUser(false);
    state.setTimeoutCountdown(0);
    state.setShowingResult(false);
    state.setWaitingForSpeech(false);
    state.setSpeechStarted(false);
    resetTranscript();
    state.setCurrentGlobalLineIndex(nextLineIndex);
    
    // Reset pending flag
    setTimeout(() => {
      pendingAdvanceRef.current = false;
    }, 100);
    
    // Continue auto mode if active
    if (state.isAutoMode) {
      const autoPlayTimeout = setTimeout(() => {
        if (state.isAutoMode && processLineAtIndexRef.current) {
          processLineAtIndexRef.current(nextLineIndex);
        }
      }, 400);
      addTimeout(autoPlayTimeout);
    }
  }, [state.currentGlobalLineIndex, lines.length, clearAllTimeouts, stop, stopListening, resetTranscript, addTimeout, state.isAutoMode, progressManager.saveProgressToLocalStorage]);

  // Create refs to avoid circular dependencies
  const processLineAtIndexRef = useRef(processLineAtIndex);
  const moveToNextLineRef = useRef(moveToNextLine);

  // Update refs when functions change
  useEffect(() => {
    processLineAtIndexRef.current = processLineAtIndex;
  }, [processLineAtIndex]);

  useEffect(() => {
    moveToNextLineRef.current = moveToNextLine;
  }, [moveToNextLine]);

  // Speech synthesis completion effect
  useEffect(() => {
    if (state.waitingForSpeech && state.isAutoMode && !state.isMyLine && state.currentLine) {
      if (isSpeaking && !state.speechStarted) {
        console.log('🔊 TTS started');
        state.setSpeechStarted(true);
        
        if (timeoutManager.speechRecoveryTimeoutRef.current) {
          clearTimeout(timeoutManager.speechRecoveryTimeoutRef.current);
          timeoutManager.speechRecoveryTimeoutRef.current = null;
        }
      } else if (!isSpeaking && state.speechStarted) {
        console.log('🔇 TTS completed, advancing');
        state.setWaitingForSpeech(false);
        state.setSpeechStarted(false);
        
        if (timeoutManager.speechRecoveryTimeoutRef.current) {
          clearTimeout(timeoutManager.speechRecoveryTimeoutRef.current);
          timeoutManager.speechRecoveryTimeoutRef.current = null;
        }
        
        const nextLineTimeout = setTimeout(() => {
          if (state.isAutoMode && moveToNextLineRef.current) {
            moveToNextLineRef.current();
          }
        }, 300);
        addTimeout(nextLineTimeout);
      }
    }
  }, [state.waitingForSpeech, isSpeaking, state.speechStarted, state.isMyLine, state.currentLine, addTimeout, state.isAutoMode]);

  // This single, consolidated useEffect manages the entire lifecycle of a user's line
  useEffect(() => {
    // Only run this logic when it's the user's turn to speak and we're in auto mode
    if (state.isMyLine && state.isAutoMode && !state.isWaitingForUser && !state.showingResult) {
      
      console.log('🎭 User line detected - setting up actor-friendly speech recognition');
      
      // 1. Clear any lingering timeout from a previous turn
      if (timeoutManager.userTimeoutRef.current) {
        console.log('🧹 Clearing previous timeout');
        clearTimeout(timeoutManager.userTimeoutRef.current);
        timeoutManager.userTimeoutRef.current = null;
      }
      
      if (timeoutManager.countdownIntervalRef.current) {
        clearInterval(timeoutManager.countdownIntervalRef.current);
        timeoutManager.countdownIntervalRef.current = null;
      }

      // 2. Set up the user's turn
      state.setIsWaitingForUser(true);
      state.setTimeoutCountdown(autoRecordTimeout); // Use dynamic timeout
      
      // 3. Start listening for the user's speech
      console.log('🎤 Starting speech recognition with actor-friendly timeout');
      startListening();

      // 4. Start countdown display
      timeoutManager.countdownIntervalRef.current = setInterval(() => {
        state.setTimeoutCountdown(prev => {
          if (prev <= 1) {
            if (timeoutManager.countdownIntervalRef.current) {
              clearInterval(timeoutManager.countdownIntervalRef.current);
              timeoutManager.countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, COUNTDOWN_UPDATE_INTERVAL_MS);

      // 5. Set a fresh timeout for the current line
      console.log(`⏰ Setting up actor-friendly user line timeout: ${autoRecordTimeout} seconds`);
      timeoutManager.userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Actor timeout reached - no speech was detected in generous time window.');
        
        // Clear countdown
        if (timeoutManager.countdownIntervalRef.current) {
          clearInterval(timeoutManager.countdownIntervalRef.current);
          timeoutManager.countdownIntervalRef.current = null;
        }
        state.setTimeoutCountdown(0);
        
        // Stop recognition and handle timeout
        stopListening();
        state.setIsWaitingForUser(false);
        
        if (state.isAutoMode) {
          console.log('🚀 Auto mode: Moving to next line after generous timeout.');
          handleAccuracyResult(0); // Score 0 and advance
        }
        
        timeoutManager.userTimeoutRef.current = null;
      }, autoRecordTimeout * 1000); // Use dynamic timeout
    }

    // Cleanup function that runs when the component re-renders or the line changes
    return () => {
      if (timeoutManager.userTimeoutRef.current) {
        clearTimeout(timeoutManager.userTimeoutRef.current);
        timeoutManager.userTimeoutRef.current = null;
      }
      if (timeoutManager.countdownIntervalRef.current) {
        clearInterval(timeoutManager.countdownIntervalRef.current);
        timeoutManager.countdownIntervalRef.current = null;
      }
    };
  }, [state.currentGlobalLineIndex, state.isMyLine, state.isAutoMode, state.isWaitingForUser, state.showingResult, autoRecordTimeout, startListening, stopListening, state.setTimeoutCountdown, timeoutManager.countdownIntervalRef.current]); // Removed handleAccuracyResult from deps

  // This separate, simple effect handles CANCELLING the timeout as soon as speech is detected
  useEffect(() => {
    if (isSpeechDetected && timeoutManager.userTimeoutRef.current) {
      console.log('🗣️ Speech detected! Cancelling the generous timeout - actor is speaking.');
      clearTimeout(timeoutManager.userTimeoutRef.current);
      timeoutManager.userTimeoutRef.current = null;
      
      // Also clear the countdown since we detected speech
      if (timeoutManager.countdownIntervalRef.current) {
        clearInterval(timeoutManager.countdownIntervalRef.current);
        timeoutManager.countdownIntervalRef.current = null;
      }
      state.setTimeoutCountdown(0);
    }
  }, [isSpeechDetected, state.setTimeoutCountdown, timeoutManager.countdownIntervalRef.current]);
  
  // This effect handles processing the FINAL transcript after the user has finished speaking
  useEffect(() => {
    console.log(`🔍 Transcript processing check: transcript="${transcript}", isMyLine=${state.isMyLine}, currentLine=${!!state.currentLine}, isWaitingForUser=${state.isWaitingForUser}`);
    
    if (transcript && state.isMyLine && state.currentLine && state.isWaitingForUser) {
      console.log(`✅ Final transcript received: "${transcript}". Processing accuracy.`);
      
      // Clear any lingering timeouts
      if (timeoutManager.userTimeoutRef.current) {
        clearTimeout(timeoutManager.userTimeoutRef.current);
        timeoutManager.userTimeoutRef.current = null;
      }
      if (timeoutManager.countdownIntervalRef.current) {
        clearInterval(timeoutManager.countdownIntervalRef.current);
        timeoutManager.countdownIntervalRef.current = null;
      }
      
      state.setIsWaitingForUser(false);
      state.setTimeoutCountdown(0);
      
      const accuracy = calculateAccuracy(state.currentLine.text, transcript, accuracyLevel);
      // setLastUserLineAccuracy(accuracy); // Store the last real accuracy result
      // setLastUserLineIndex(currentGlobalLineIndex); // Store the line index
      console.log(`📊 Calculated accuracy: ${accuracy}% for line "${state.currentLine.text.substring(0, 50)}..."`);
      handleAccuracyResult(accuracy);
      resetTranscript(); // Clear the transcript for the next line
    } else if (transcript && !state.isWaitingForUser) {
      console.log(`⚠️ Transcript received but not waiting for user: transcript="${transcript}", isMyLine=${state.isMyLine}, currentLine=${!!state.currentLine}, isWaitingForUser=${state.isWaitingForUser}`);
    }
  }, [transcript, state.isMyLine, state.currentLine, state.isWaitingForUser, accuracyLevel]); // Runs only when a new transcript is available

  // Advance immediately when recognition ends and no transcript is present (no fallback timeout)
  useEffect(() => {
    if (state.isMyLine && state.isWaitingForUser && !isListening && !transcript && state.isAutoMode) {
      state.setIsWaitingForUser(false);
      state.setTimeoutCountdown(0);
      handleAccuracyResult(0);
    }
  }, [state.isListening, state.isMyLine, state.isWaitingForUser, transcript, state.isAutoMode, state.setTimeoutCountdown]);

  // When moving to a new user line, keep the last icon until a new real result is available
  // useEffect(() => {
  //   if (isMyLine && currentGlobalLineIndex !== lastUserLineIndex) {
  //     // Clear the icon for a new user line until a real result is available
  //     setLastUserLineAccuracy(null);
  //     setLastUserLineIndex(null);
  //   }
  // }, [isMyLine, currentGlobalLineIndex, lastUserLineIndex]);

  // 🔥 --- END OF CONSOLIDATED TIMEOUT FIX --- 🔥

  const overallPerformance = useMemo(() => {
    if (Object.keys(state.accuracyScores).length === 0) return 'Perfect';
    
    const scores = Object.values(state.accuracyScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 70) return 'Perfect';
    if (averageScore >= 40) return 'Not Bad';
    return 'Can Be Better';
  }, [state.accuracyScores]);



  // Auto-scroll effect to keep current line in view
  useEffect(() => {
    if (currentLineRef.current && chatContainerRef.current) {
      // Use a small delay to ensure DOM is updated
      const scrollTimeout = setTimeout(() => {
        if (currentLineRef.current) {
          currentLineRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimeout);
    }
  }, [state.currentGlobalLineIndex, state.playedLines.size]);

  // Jump to specific act and scene
  const jumpToActAndScene = useCallback((actNumber: number, sceneNumber: number) => {
    console.log(`🎬 Jumping to Act ${actNumber}, Scene ${sceneNumber}`);
    const lineIndex = lines.findIndex(line => 
      (line.actNumber || 1) === actNumber && (line.sceneNumber || 1) === sceneNumber
    );
    
    if (lineIndex !== -1) {
      clearAllTimeouts();
      stop();
      stopListening();
      
      state.setCurrentGlobalLineIndex(lineIndex);
      state.setIsWaitingForUser(false);
      state.setShowingResult(false);
      state.setWaitingForSpeech(false);
      state.setSpeechStarted(false);
      state.setTimeoutCountdown(0);
      resetTranscript();
      state.setPlayedLines(new Set());
      
      // Save progress after scene jump
      setTimeout(progressManager.saveProgressToLocalStorage, 100);
    }
  }, [lines, clearAllTimeouts, stop, stopListening, state.setCurrentGlobalLineIndex, state.setIsWaitingForUser, state.setShowingResult, state.setWaitingForSpeech, state.setSpeechStarted, state.setTimeoutCountdown, resetTranscript, state.setPlayedLines, progressManager.saveProgressToLocalStorage]);

  // Handle accuracy result
  const handleAccuracyResult = useCallback((accuracy: number) => {
    console.log(`📊 Accuracy result: ${accuracy}% for line ${state.myLineIndex} - Auto mode: ${state.isAutoMode}`);
    
    if (state.myLineIndex >= 0) {
      state.setAccuracyScores(prev => ({ ...prev, [state.myLineIndex]: accuracy }));
      
      if (accuracy >= 70) {
        state.setCompletedLines(prev => new Set([...prev, state.myLineIndex]));
      }
      
      // Save progress immediately after accuracy update
      setTimeout(progressManager.saveProgressToLocalStorage, 50);
    }
    
    state.setShowingResult(true);
    
    const displayTime = state.isAutoMode ? 600 : 1200;
    
    const resultTimeout = setTimeout(() => {
      console.log('⏰ Result timeout - continuing');
      state.setShowingResult(false);
      if (state.isAutoMode) {
        console.log('🚀 Auto mode - moving to next line');
        moveToNextLine();
      }
    }, displayTime);
    
    addTimeout(resultTimeout);
  }, [state.myLineIndex, addTimeout, state.isAutoMode, progressManager.saveProgressToLocalStorage, state.setShowingResult, state.isAutoMode, moveToNextLine]);

  // Auto-start voice recognition when navigating to user lines in manual mode
  useEffect(() => {
    if (!state.isAutoMode && state.isMyLine && !state.isWaitingForUser && !state.showingResult) {
      const autoVoiceTimeout = setTimeout(() => {
        handleManualLinePlay();
      }, 500);
      return () => clearTimeout(autoVoiceTimeout);
    }
  }, [state.currentGlobalLineIndex, state.isAutoMode, state.isMyLine, state.isWaitingForUser, state.showingResult, handleManualLinePlay]);

  // ONLY communicate with parent when EXITING the session
  const handleBack = useCallback(() => {
    console.log('🔙 Exiting session - notifying parent of final progress');
    
    // Save to localStorage first
    progressManager.saveProgressToLocalStorage();
    
    // Create final progress object for parent
    if (state.currentLine && selectedCharacter) {
      const finalProgress: UserProgress = {
        scriptId: scriptTitle,
        character: selectedCharacter,
        lastActNumber: state.currentLine.actNumber || 1,
        lastSceneNumber: state.currentLine.sceneNumber || 1,
        lastLineIndex: state.currentGlobalLineIndex,
        completedLines: Array.from(state.completedLines),
        accuracyScores: state.accuracyScores
      };
      
      // Only now do we communicate with the parent
      onProgressUpdate(finalProgress);
    }
    
    // Small delay to ensure progress is saved before navigating
    setTimeout(() => onBack(), 100);
  }, [progressManager.saveProgressToLocalStorage, state.currentLine, selectedCharacter, scriptTitle, state.currentGlobalLineIndex, state.completedLines, state.accuracyScores, onProgressUpdate, onBack]);

  const renderLineText = (line: ScriptLine, isCurrentLine: boolean) => {
    if (line.character !== selectedCharacter) {
      return line.text;
    }

    if (!isCurrentLine || state.hideLevel === 'show-all') {
      return line.text;
    }

    if (state.hideLevel === 'hide-all') {
      return `••• ${t('practice.yourLine')} •••`;
    }

    // Use percentage-based hiding
    const words = line.text.split(' ');
    const hiddenIndices = getHiddenWords(line.text, line.id, state.hideLevel);
    
    return words.map((word, index) => 
      hiddenIndices.has(index) ? '___' : word
    ).join(' ');
  };

  // In the render bubble for the user line, show only the icon (not the percentage), and only after a real result
  const renderUserLineResultIcon = (accuracy: number | undefined) => {
    if (accuracy === undefined || accuracy === null) return null;
    if (accuracy >= 70) return <span title="Great!" className="ml-2 text-green-600 text-xl">😊</span>;
    if (accuracy >= 40) return <span title="Not bad" className="ml-2 text-yellow-600 text-xl">😐</span>;
    return <span title="Keep practicing!" className="ml-2 text-orange-600 text-xl">😞</span>;
  };

  // Scene Navigator Component for bottom navigation
  const SceneNavigatorComponent = () => {
    const currentAct = state.currentLine?.actNumber || 1;
    const currentScene = state.currentLine?.sceneNumber || 1;

    // Get unique acts and scenes
    const acts = Array.from(new Set(lines.map(line => line.actNumber || 1))).sort((a, b) => a - b);
    const scenesInCurrentAct = Array.from(
      new Set(lines.filter(line => (line.actNumber || 1) === currentAct).map(line => line.sceneNumber || 1))
    ).sort((a, b) => a - b);

    const currentActIndex = acts.indexOf(currentAct);
    const currentSceneIndex = scenesInCurrentAct.indexOf(currentScene);

    const canGoPrevAct = currentActIndex > 0;
    const canGoNextAct = currentActIndex < acts.length - 1;
    const canGoPrevScene = currentSceneIndex > 0;
    const canGoNextScene = currentSceneIndex < scenesInCurrentAct.length - 1;

    const goToPreviousAct = () => {
      if (canGoPrevAct) {
        const prevAct = acts[currentActIndex - 1];
        const firstSceneInAct = Array.from(
          new Set(lines.filter(line => (line.actNumber || 1) === prevAct).map(line => line.sceneNumber || 1))
        ).sort((a, b) => a - b)[0];
        jumpToActAndScene(prevAct, firstSceneInAct);
      }
    };

    const goToNextAct = () => {
      if (canGoNextAct) {
        const nextAct = acts[currentActIndex + 1];
        const firstSceneInAct = Array.from(
          new Set(lines.filter(line => (line.actNumber || 1) === nextAct).map(line => line.sceneNumber || 1))
        ).sort((a, b) => a - b)[0];
        jumpToActAndScene(nextAct, firstSceneInAct);
      }
    };

    const goToPreviousScene = () => {
      if (canGoPrevScene) {
        const prevScene = scenesInCurrentAct[currentSceneIndex - 1];
        jumpToActAndScene(currentAct, prevScene);
      }
    };

    const goToNextScene = () => {
      if (canGoNextScene) {
        const nextScene = scenesInCurrentAct[currentSceneIndex + 1];
        jumpToActAndScene(currentAct, nextScene);
      }
    };

    return (
      <div className="flex items-center justify-between px-4 py-2">
        {/* Act Navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousAct}
            disabled={!canGoPrevAct}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Previous Act"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1 px-3 py-1 bg-purple-50 rounded text-purple-700 text-sm">
            <Book className="w-3 h-3" />
            <span className="font-medium">Act {currentAct}</span>
          </div>
          
          <button
            onClick={goToNextAct}
            disabled={!canGoNextAct}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Next Act"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scene Navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPreviousScene}
            disabled={!canGoPrevScene}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Previous Scene"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded text-blue-700 text-sm">
            <FileText className="w-3 h-3" />
            <span className="font-medium">Scene {currentScene}</span>
          </div>
          
          <button
            onClick={goToNextScene}
            disabled={!canGoNextScene}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Next Scene"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Check if we've completed all lines
  const allLinesCompleted = state.currentGlobalLineIndex >= lines.length - 1 && !state.isAutoMode;

  if (allLinesCompleted && state.completedLines.size === state.myLines.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {overallPerformance === 'Perfect' ? '🎉' : 
             overallPerformance === 'Not Bad' ? '👍' : '💪'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('practice.completion.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('practice.completion.subtitle')} {selectedCharacter}
          </p>
          <div className="space-y-4">
            <div className="text-lg font-semibold">
              <span className={`${
                overallPerformance === 'Perfect' ? 'text-green-600' :
                overallPerformance === 'Not Bad' ? 'text-yellow-600' : 'text-orange-600'
              }`}>
                {overallPerformance}
              </span>
              <span className="text-gray-600 ml-2">({Math.round(state.progress)}%)</span>
            </div>
            <button
              onClick={handleBack}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              {t('practice.completion.newSession')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PracticeHeader
        scriptTitle={scriptTitle}
        selectedCharacter={selectedCharacter}
        hideLevel={state.hideLevel}
        setHideLevel={state.setHideLevel}
        showHideDropdown={state.showHideDropdown}
        setShowHideDropdown={state.setShowHideDropdown}
        t={t}
        hiddenWordsMap={wordHiding.hiddenWordsMap}
        onBack={handleBack}
      />

      {/* Chat Messages Area - Takes most of the space */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 scroll-smooth"
        style={{ paddingBottom: '380px' }} // Space for fixed bottom navigation
      >
        {lines.slice(0, state.currentGlobalLineIndex + 1).map((line, index) => {
          const isCurrentLine = index === state.currentGlobalLineIndex;
          const isUserLine = line.character === selectedCharacter;
          const hasPlayed = state.playedLines.has(index) || isCurrentLine;
          const lineAccuracy = isUserLine ? state.accuracyScores[state.myLines.findIndex(l => l.id === line.id)] : undefined;
          
          if (!hasPlayed && !isCurrentLine) return null;

          return (
            <div key={line.id} ref={isCurrentLine ? currentLineRef : null}>
              {/* Character Name Label */}
              <div className={`flex items-center space-x-2 mb-2 text-gray-600 ${
                isUserLine ? 'justify-end' : 'justify-start'
              }`}>
                {!isUserLine && <MessageCircle className="w-4 h-4" />}
                {isUserLine && <User className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {line.character}{isUserLine ? ' (YOU)' : ''}
                </span>
                {isUserLine && <MessageCircle className="w-4 h-4" />}
              </div>

              {/* Speech Bubble and Accuracy Result Container */}
              <div className={`flex items-start space-x-3 mb-4 ${isUserLine ? 'justify-end' : 'justify-start'}`}>
                {/* Accuracy Result Badge - positioned to the left of user speech bubble */}
                {isUserLine && lineAccuracy !== undefined && (!isCurrentLine || (!state.isWaitingForUser && isCurrentLine)) && (
                  <div className="flex-shrink-0 mt-2">
                    {renderUserLineResultIcon(lineAccuracy)}
                    {!state.isAutoMode && (
                      <button
                        onClick={handleRetryLine}
                        className="block mx-auto mt-1 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title="Retry"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Speech Bubble - Enhanced with improved readability */}
                <div 
                  className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-sm text-white text-[0.95rem] leading-[1.6] ${
                    characterColors[line.character]
                  } ${isCurrentLine ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}
                >
                  {/* Message Text - preserve exact formatting and line breaks */}
                  <p className="whitespace-pre-wrap">
                    {renderLineText(line, isCurrentLine)}
                  </p>

                  {/* Current Line Status Indicators */}
                  {isCurrentLine && (
                    <div className="mt-3 space-y-2">
                      {/* User Line Recording Status */}
                      {isUserLine && (
                        <div className="flex items-center space-x-2 text-xs">
                          {state.isWaitingForUser ? (
                            isListening ? (
                              <div className="flex items-center space-x-1 text-red-200">
                                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                                <span>Recording...</span>
                                {isSpeechDetected && (
                                  <span className="text-green-200 ml-1">✓ Speech detected</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-yellow-200">
                                <Mic className="w-3 h-3" />
                                <span>Ready to speak</span>
                              </div>
                            )
                          ) : !state.isAutoMode && speechRecognitionSupported && (
                            <div className="flex items-center space-x-1 text-yellow-200">
                              <Mic className="w-3 h-3" />
                              <span>Tap to start recording</span>
                            </div>
                          )}
                          
                          {/* Generous timeout countdown */}
                          {state.timeoutCountdown > 0 && !isSpeechDetected && state.isAutoMode && isUserLine && (
                            <div className="flex items-center space-x-1 text-orange-200">
                              <Clock className="w-3 h-3" />
                              <span>{state.timeoutCountdown}s generous time</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Other Character TTS Status */}
                      {!isUserLine && (
                        state.waitingForSpeech ? (
                          <div className="flex items-center space-x-1 text-xs text-blue-200">
                            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                            <span>
                              {isSpeaking ? 'Speaking...' : 'Starting...'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              state.setWaitingForSpeech(true);
                              state.setSpeechStarted(false);
                              const characterVoiceSettings = getCharacterVoiceSettings(line.character);
                              speak(line.text, characterVoiceSettings, language);
                            }}
                            className="flex items-center space-x-1 text-xs text-blue-200 hover:text-blue-100 transition-colors duration-200"
                            title="Play line"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Play</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section - Fixed */}
      <PracticeFooter
        progress={state.progress}
        completedLines={state.completedLines}
        myLines={state.myLines}
        currentGlobalLineIndex={state.currentGlobalLineIndex}
        lines={lines}
        handleManualPrev={handleManualPrev}
        handleManualNext={handleManualNext}
        isAutoMode={state.isAutoMode}
        stopAutoMode={stopAutoMode}
        startAutoMode={startAutoMode}
        t={t}
        speechRecognitionSupported={speechRecognitionSupported}
        SceneNavigatorComponent={SceneNavigatorComponent}
      />
    </div>
  );
};