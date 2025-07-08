import { useState, useEffect, useCallback, useRef } from 'react';
import { ScriptLine, Character, AccuracyLevel, VoiceSettings, UserProgress } from '../types';
import { calculateAccuracy } from '../utils/scriptParser';

// Simple, reliable state types
export type PracticeMode = 'auto' | 'manual';

export interface PracticeState {
  // Core state
  currentLineIndex: number;
  isAutoMode: boolean;
  isPlaying: boolean;
  
  // Progress tracking
  completedLines: Set<number>;
  accuracyScores: { [key: number]: number };
  
  // UI state
  timeoutCountdown: number;
  showingResult: boolean;
  resultAccuracy: number | null;
  
  // Speech state - like the working version
  isWaitingForUser: boolean;
  
  // Scene info
  linesLength: number;
}

// Props for the hook
export interface UsePracticeEngineProps {
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
  
  // Callbacks
  onProgressUpdate: (progress: UserProgress) => void;
  onSceneComplete?: () => void;
  onGoToPreviousScene?: () => void;
}

// Initial state
const createInitialState = (startingLineIndex: number, practiceMode: PracticeMode, linesLength: number): PracticeState => ({
  currentLineIndex: startingLineIndex,
  isAutoMode: practiceMode === 'auto',
  isPlaying: false,
  completedLines: new Set(),
  accuracyScores: {},
  timeoutCountdown: 0,
  showingResult: false,
  resultAccuracy: null,
  isWaitingForUser: false,
  linesLength,
});

export function usePracticeEngine(props: UsePracticeEngineProps) {
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
    speak,
    stop,
    isSpeaking,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    speechRecognitionSupported,
    isSpeechDetected,
    onProgressUpdate,
    onSceneComplete,
    onGoToPreviousScene,
  } = props;

  // Use ref to avoid stale closures in effects
  const propsRef = useRef(props);
  propsRef.current = props;

  // Simple state management like the working PracticeSession.tsx
  const [state, setState] = useState(() => createInitialState(startingLineIndex, practiceMode, lines.length));

  // Refs for timeouts and persistent state
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const wasSpeakingRef = useRef(false);

  // Track if we just resumed from pause
  const [justResumed, setJustResumed] = useState(false);

  // Helper functions
  const addTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Get character voice settings
  const getCharacterVoiceSettings = useCallback((characterName: string): VoiceSettings => {
    const character = propsRef.current.characters.find(c => c.name === characterName);
    return {
      rate: propsRef.current.voiceSettings.rate,
      volume: propsRef.current.voiceSettings.volume,
      voiceIndex: character?.voiceSettings?.voiceIndex ?? propsRef.current.voiceSettings.voiceIndex,
    };
  }, []);

  // Save progress to localStorage
  const saveProgressToLocalStorage = useCallback(() => {
    if (!isMountedRef.current || !propsRef.current.lines || propsRef.current.lines.length === 0) return;
    
    try {
      const currentLine = propsRef.current.lines[state.currentLineIndex];
      const progress: UserProgress = {
        scriptId: propsRef.current.scriptTitle,
        character: propsRef.current.selectedCharacter,
        lastActNumber: currentLine?.actNumber || 1,
        lastSceneNumber: currentLine?.sceneNumber || 1,
        lastLineIndex: state.currentLineIndex,
        completedLines: Array.from(state.completedLines),
        accuracyScores: state.accuracyScores,
      };
      
      const progressKey = `${propsRef.current.scriptTitle}-${propsRef.current.selectedCharacter}`;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      
      // Background sync to database
      import('../utils/progressSync').then(({ syncProgressToDatabase }) => {
        syncProgressToDatabase(undefined, propsRef.current.scriptTitle, propsRef.current.selectedCharacter, progress);
      }).catch(() => {
        // Background sync not available
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [state.currentLineIndex, state.completedLines, state.accuracyScores]);

  // Update isAutoMode when practiceMode prop changes
  useEffect(() => {
    const newIsAutoMode = propsRef.current.practiceMode === 'auto';
    if (state.isAutoMode !== newIsAutoMode) {
      console.log(`🔄 Practice mode changed: ${propsRef.current.practiceMode} (isAutoMode: ${newIsAutoMode})`);
      setState(prev => ({ ...prev, isAutoMode: newIsAutoMode }));
    }
  }, [propsRef.current.practiceMode, state.isAutoMode]);

  // Auto-start practice based on practice mode - only run once on mount
  useEffect(() => {
    if (propsRef.current.practiceMode === 'auto') {
      console.log('🚀 Auto mode detected - starting practice session');
      const autoStartTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('🚀 Starting auto mode');
          setState(prev => ({ ...prev, isPlaying: true }));
        }
      }, 300);
      addTimeout(autoStartTimeout);
    }

    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
      propsRef.current.stop();
      propsRef.current.stopListening();
      saveProgressToLocalStorage();
    };
  }, []); // Empty dependency array - only run once on mount

  // Manual mode: Process line when navigating (TTS for partner lines, speech recognition for user lines)
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine || !state.isPlaying || state.isAutoMode) return;

    console.log(`🎬 Manual mode: Processing line ${state.currentLineIndex + 1}`);
    
    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;

    if (isMyLine) {
      // User line - start speech recognition
      console.log('🎤 Manual mode - starting speech recognition for user line');
      setState(prev => ({ 
        ...prev, 
        isWaitingForUser: true,
        timeoutCountdown: propsRef.current.autoRecordTimeout 
      }));
      
      propsRef.current.startListening();
      
      // Set up timeout for manual mode
      if (userTimeoutRef.current) {
        clearTimeout(userTimeoutRef.current);
      }
      
      userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Manual mode timeout reached');
        propsRef.current.stopListening();
        setState(prev => ({ 
          ...prev, 
          isWaitingForUser: false,
          timeoutCountdown: 0
        }));
      }, propsRef.current.autoRecordTimeout * 1000);
    } else {
      // Partner line - start TTS
      console.log('🗣️ Manual mode - starting TTS for partner line');
      const characterVoiceSettings = getCharacterVoiceSettings(currentLine.character);
      const ttsTimeout = setTimeout(() => {
        console.log('🔊 Speaking partner line in manual mode');
        propsRef.current.speak(currentLine.text, characterVoiceSettings, propsRef.current.language);
      }, 200);
      addTimeout(ttsTimeout);
    }
  }, [state.currentLineIndex, state.isPlaying, state.isAutoMode, getCharacterVoiceSettings, addTimeout]);

  // Main line processing effect - only handles partner lines (TTS) in auto mode
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine || !state.isPlaying || !state.isAutoMode) return;

    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;

    // Only process partner lines here - user lines are handled by separate effect
    if (!isMyLine && (justResumed || !wasSpeakingRef.current)) {
      // On resume or initial entry, re-initiate TTS for partner line
      console.log(`🎬 (Resume) Processing partner line ${state.currentLineIndex + 1}: ${currentLine.character} - "${currentLine.text.substring(0, 50)}..."`);
      clearAllTimeouts();
      propsRef.current.resetTranscript();
      // Partner's line - start TTS
      console.log('🗣️ Partner line - starting TTS');
      const characterVoiceSettings = getCharacterVoiceSettings(currentLine.character);
      const ttsTimeout = setTimeout(() => {
        console.log('🔊 Speaking partner line');
        propsRef.current.speak(currentLine.text, characterVoiceSettings, propsRef.current.language);
      }, 200);
      addTimeout(ttsTimeout);
      setJustResumed(false);
    }
  }, [state.currentLineIndex, state.isPlaying, state.isAutoMode, clearAllTimeouts, addTimeout, getCharacterVoiceSettings, justResumed]);

  // Separate effect for user lines - follows the working pattern exactly
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine) return;
    
    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;

    // Only run this logic when it's the user's turn to speak and we're in auto mode and not paused
    if (isMyLine && state.isAutoMode && state.isPlaying && !state.isWaitingForUser && !state.showingResult && propsRef.current.speechRecognitionSupported && (justResumed || !wasSpeakingRef.current)) {
      console.log('🎭 User line detected - setting up actor-friendly speech recognition');
      
      // 1. Clear any lingering timeout from a previous turn
      if (userTimeoutRef.current) {
        console.log('🧹 Clearing previous timeout');
        clearTimeout(userTimeoutRef.current);
        userTimeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // 2. Set up the user's turn
      setState(prev => ({ 
        ...prev, 
        isWaitingForUser: true,
        timeoutCountdown: propsRef.current.autoRecordTimeout 
      }));
      
      // 3. Start listening for the user's speech
      console.log('🎤 Starting speech recognition with actor-friendly timeout');
      propsRef.current.startListening();

      // 4. Start countdown display
      countdownIntervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, timeoutCountdown: Math.max(0, prev.timeoutCountdown - 1) }));
      }, 1000);

      // 5. Set a fresh timeout for the current line
      console.log(`⏰ Setting up actor-friendly user line timeout: ${propsRef.current.autoRecordTimeout} seconds`);
      userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Actor timeout reached - no speech was detected in generous time window.');
        
        // Clear countdown
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        
        // Stop recognition and handle timeout
        propsRef.current.stopListening();
        setState(prev => ({ 
          ...prev, 
          isWaitingForUser: false,
          timeoutCountdown: 0,
          showingResult: true, 
          resultAccuracy: 0,
          accuracyScores: { ...prev.accuracyScores, [prev.currentLineIndex]: 0 }
        }));
        
        userTimeoutRef.current = null;
      }, propsRef.current.autoRecordTimeout * 1000);
      setJustResumed(false);
    }

    // Cleanup function that runs when the component re-renders or the line changes
    return () => {
      if (userTimeoutRef.current) {
        clearTimeout(userTimeoutRef.current);
        userTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [state.currentLineIndex, state.isAutoMode, state.isPlaying, state.showingResult, justResumed]); // Removed isWaitingForUser from deps

  // TTS completion effect - simple and reliable like the working component
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine || !state.isPlaying) return;

    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;

    // Only handle partner lines and only advance in auto mode
    if (!isMyLine && wasSpeakingRef.current && !isSpeaking && state.isAutoMode) {
      console.log('🔊 TTS completed - advancing to next line (auto mode)');
      const nextLineTimeout = setTimeout(() => {
        if (state.isPlaying) {
          const nextIndex = state.currentLineIndex + 1;
          if (nextIndex >= state.linesLength) {
            console.log('🎭 Scene complete');
            setState(prev => ({ ...prev, isPlaying: false }));
            if (propsRef.current.onSceneComplete) {
              propsRef.current.onSceneComplete();
            }
          } else {
            console.log(`⏭️ Moving to line ${nextIndex + 1}`);
            setState(prev => ({ ...prev, currentLineIndex: nextIndex }));
          }
        }
      }, 300);
      addTimeout(nextLineTimeout);
    }
    
    // Update the ref to track current speaking state
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, state.currentLineIndex, state.isPlaying, state.isAutoMode, state.linesLength, addTimeout]);

  // Speech detection effect - cancels timeout but keeps listening
  useEffect(() => {
    if (propsRef.current.isSpeechDetected && userTimeoutRef.current) {
      console.log('🗣️ Speech detected! Cancelling the generous timeout - actor is speaking.');
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      setState(prev => ({ ...prev, timeoutCountdown: 0 }));
    }
  }, [propsRef.current.isSpeechDetected]);

  // Transcript processing effect - only process when user finishes speaking
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine || !state.isPlaying) return;
    
    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;

    console.log(`🔍 Transcript processing check: transcript="${propsRef.current.transcript}", isMyLine=${isMyLine}, isWaitingForUser=${state.isWaitingForUser}`);
    
    if (propsRef.current.transcript && isMyLine && state.isWaitingForUser) {
      console.log(`✅ Final transcript received: "${propsRef.current.transcript}". Processing accuracy.`);
      
      // Clear any lingering timeouts
      if (userTimeoutRef.current) {
        clearTimeout(userTimeoutRef.current);
        userTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      propsRef.current.stopListening();
      setState(prev => ({ ...prev, isWaitingForUser: false, timeoutCountdown: 0 }));
      
      const accuracy = calculateAccuracy(currentLine.text, propsRef.current.transcript, propsRef.current.accuracyLevel);
      console.log(`📊 Calculated accuracy: ${accuracy}% for line "${currentLine.text.substring(0, 50)}..."`);
      
      setState(prev => ({ 
        ...prev, 
        showingResult: true, 
        resultAccuracy: accuracy,
        accuracyScores: { ...prev.accuracyScores, [prev.currentLineIndex]: accuracy },
        completedLines: accuracy >= 70 
          ? new Set([...prev.completedLines, prev.currentLineIndex])
          : prev.completedLines
      }));
      propsRef.current.resetTranscript();
    }
  }, [state.currentLineIndex, state.isPlaying, state.isWaitingForUser, propsRef.current.transcript]);

  // Advance immediately when recognition ends and no transcript is present (actor pauses) - AUTO MODE ONLY
  useEffect(() => {
    const currentLine = propsRef.current.lines[state.currentLineIndex];
    if (!currentLine) return;
    
    const isMyLine = currentLine.character === propsRef.current.selectedCharacter;
    
    // Add a small delay to prevent immediate advancement when speech recognition starts
    const timeoutId = setTimeout(() => {
      if (isMyLine && state.isWaitingForUser && !propsRef.current.isListening && !propsRef.current.transcript && state.isAutoMode && state.isPlaying) {
        console.log('🤐 Speech recognition ended without transcript - actor paused, advancing (auto mode)');
        setState(prev => ({ 
          ...prev, 
          isWaitingForUser: false, 
          timeoutCountdown: 0,
          showingResult: true, 
          resultAccuracy: 0,
          accuracyScores: { ...prev.accuracyScores, [prev.currentLineIndex]: 0 }
        }));
      }
    }, 100); // Small delay to prevent immediate advancement
    
    return () => clearTimeout(timeoutId);
  }, [propsRef.current.isListening, state.isWaitingForUser, propsRef.current.transcript, state.isPlaying, state.isAutoMode, state.currentLineIndex]);

  // Result display effect - AUTO MODE ONLY for advancement
  useEffect(() => {
    if (state.showingResult) {
      const displayTime = state.isAutoMode ? 600 : 1200;
      
      const resultTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, showingResult: false, resultAccuracy: null }));
        
        // Only auto-advance in auto mode
        if (state.isAutoMode && state.isPlaying) {
          const nextIndex = state.currentLineIndex + 1;
          if (nextIndex >= state.linesLength) {
            console.log('🎭 Scene complete');
            setState(prev => ({ ...prev, isPlaying: false }));
            if (propsRef.current.onSceneComplete) {
              propsRef.current.onSceneComplete();
            }
          } else {
            console.log(`⏭️ Moving to line ${nextIndex + 1}`);
            setState(prev => ({ ...prev, currentLineIndex: nextIndex }));
          }
        }
      }, displayTime);
      
      addTimeout(resultTimeout);
    }
  }, [state.showingResult, state.isAutoMode, state.isPlaying, state.currentLineIndex, state.linesLength, addTimeout]);

  // Effect to handle pause - stop all ongoing activities
  // Only run when isPlaying changes from true to false (user-initiated pause)
  const wasPlayingRef = useRef(state.isPlaying);
  useEffect(() => {
    // Only stop activities when transitioning from playing to paused (user-initiated pause)
    if (wasPlayingRef.current && !state.isPlaying) {
      console.log('⏸️ User paused - stopping all activities');
      
      // Stop TTS if it's speaking
      if (propsRef.current.isSpeaking) {
        propsRef.current.stop();
      }
      
      // Stop speech recognition if it's listening
      if (propsRef.current.isListening) {
        propsRef.current.stopListening();
      }
      
      // Clear all timeouts
      clearAllTimeouts();
      
      // Reset transcript
      propsRef.current.resetTranscript();
    }
    
    // Update the ref to track previous playing state
    wasPlayingRef.current = state.isPlaying;
  }, [state.isPlaying, clearAllTimeouts]);

  // Action creators for the UI
  const actions = {
    startAutoMode: () => setState(prev => ({
      ...prev,
      isPlaying: true,
      isWaitingForUser: false,
      showingResult: false,
      resultAccuracy: null,
      timeoutCountdown: 0
    })),
    stopAutoMode: () => setState(prev => ({ ...prev, isPlaying: false })),
    pause: () => setState(prev => ({ ...prev, isPlaying: false })),
    resume: () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isWaitingForUser: false,
        showingResult: false,
        resultAccuracy: null,
        timeoutCountdown: 0
      }));
      setJustResumed(true);
    },
    nextLine: () => {
      const nextIndex = state.currentLineIndex + 1;
      if (nextIndex < state.linesLength) {
        // Clear any ongoing activities before moving
        clearAllTimeouts();
        propsRef.current.stop();
        propsRef.current.stopListening();
        propsRef.current.resetTranscript();
        
        setState(prev => ({ 
          ...prev, 
          currentLineIndex: nextIndex,
          isWaitingForUser: false,
          showingResult: false,
          resultAccuracy: null,
          timeoutCountdown: 0
        }));
      }
    },
    previousLine: () => {
      if (state.currentLineIndex > 0) {
        // Clear any ongoing activities before moving
        clearAllTimeouts();
        propsRef.current.stop();
        propsRef.current.stopListening();
        propsRef.current.resetTranscript();
        
        setState(prev => ({ 
          ...prev, 
          currentLineIndex: prev.currentLineIndex - 1,
          isWaitingForUser: false,
          showingResult: false,
          resultAccuracy: null,
          timeoutCountdown: 0
        }));
      }
    },
    jumpToLine: (lineIndex: number) => {
      if (lineIndex >= 0 && lineIndex < state.linesLength) {
        // Clear any ongoing activities before moving
        clearAllTimeouts();
        propsRef.current.stop();
        propsRef.current.stopListening();
        propsRef.current.resetTranscript();
        
        setState(prev => ({ 
          ...prev, 
          currentLineIndex: lineIndex,
          isWaitingForUser: false,
          showingResult: false,
          resultAccuracy: null,
          timeoutCountdown: 0,
          isPlaying: true // Always start playing after jump
        }));
      }
    },
    retryLine: () => {
      // Reset accuracy for current line
      setState(prev => {
        const newAccuracyScores = { ...prev.accuracyScores };
        delete newAccuracyScores[prev.currentLineIndex];
        
        const newCompletedLines = new Set(prev.completedLines);
        newCompletedLines.delete(prev.currentLineIndex);
        
        return {
          ...prev,
          accuracyScores: newAccuracyScores,
          completedLines: newCompletedLines,
          showingResult: false,
          resultAccuracy: null,
        };
      });
    },
  };

  return {
    state,
    actions,
    saveProgressToLocalStorage,
    clearAllTimeouts,
    getCharacterVoiceSettings,
  };
} 