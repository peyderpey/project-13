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

// 🔥 FIX: Clear, generous timeout for actors with dramatic timing needs
const COUNTDOWN_UPDATE_INTERVAL_MS = 1000; // 1 second for countdown updates

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

export const PracticeSession: React.FC<PracticeSessionProps> = ({
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
  // Speech synthesis props
  speak,
  stop,
  isSpeaking,
  // Speech recognition props
  isListening,
  transcript,
  startListening,
  stopListening,
  resetTranscript,
  speechRecognitionSupported,
  isSpeechDetected
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Initialize state
  const [currentGlobalLineIndex, setCurrentGlobalLineIndex] = useState(startingLineIndex);
  const [isAutoMode, setIsAutoMode] = useState(practiceMode === 'auto');
  const [isAutoPaused, setIsAutoPaused] = useState(true); // Start paused by default
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
  
  // Refs for persistent state across re-renders
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const hiddenWordsMap = useRef<Map<string, Set<number>>>(new Map());
  const speechRecoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAdvanceRef = useRef(false);
  const progressKeyRef = useRef(`${scriptTitle}-${selectedCharacter}`);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // Track if component is mounted
  
  // Calculate derived state
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
  
  // Debounced progress saving to reduce database calls
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

  // Load initial progress from localStorage on mount
  useEffect(() => {
    console.log('PracticeSession mounted - loading progress from localStorage');
    
    const savedProgress = localStorage.getItem(progressKeyRef.current);
    if (savedProgress) {
      try {
        const progress: UserProgress = JSON.parse(savedProgress);
        if (Array.isArray(progress.completedLines)) {
          setCompletedLines(new Set(progress.completedLines));
        }
        if (progress.accuracyScores) {
          setAccuracyScores(progress.accuracyScores);
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
        if (isMountedRef.current) {
          startAutoMode();
        }
      }, 300);
      
      return () => {
        console.log('PracticeSession unmounting - final progress save');
        isMountedRef.current = false;
        clearTimeout(autoStartTimeout);
        clearAllTimeouts();
        stop();
        stopListening();
        saveProgressToLocalStorage();
      };
    } else {
      console.log('MANUAL MODE: Ready for manual operation');
      const manualTTSTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          if (!isMyLine) {
            console.log('MANUAL MODE: Playing TTS for current line');
            playCurrentLineTTS();
          } else {
            handleManualLinePlay();
          }
        }
      }, 300);

      return () => {
        console.log('PracticeSession unmounting - final progress save');
        isMountedRef.current = false;
        clearTimeout(manualTTSTimeout);
        clearAllTimeouts();
        stop();
        stopListening();
        saveProgressToLocalStorage();
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
    if (currentLine && !isMyLine) {
      const characterVoiceSettings = getCharacterVoiceSettings(currentLine.character);
      speak(currentLine.text, characterVoiceSettings, language);
    }
  }, [currentLine, isMyLine, speak, language, getCharacterVoiceSettings]);

  // Helper functions
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
    
    // Clear user timeout specifically
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
    
    // Clear countdown interval specifically  
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    if (speechRecoveryTimeoutRef.current) {
      clearTimeout(speechRecoveryTimeoutRef.current);
      speechRecoveryTimeoutRef.current = null;
    }
  }, []);

  // AUTOMATIC VOICE RECOGNITION: Always start listening for user lines in manual mode
  const handleManualLinePlay = useCallback(() => {
    if (isMyLine && speechRecognitionSupported) {
      console.log('🎤 Manual mode - starting voice recognition with actor-friendly timeout');
      setIsWaitingForUser(true);
      startListening();
      
      // Set up the same generous timeout for manual mode
      if (userTimeoutRef.current) {
        clearTimeout(userTimeoutRef.current);
      }
      
      console.log(`⏰ Manual mode: Setting up actor-friendly timeout: ${autoRecordTimeout} seconds`);
      userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Manual mode timeout reached - generous time expired');
        stopListening();
        setIsWaitingForUser(false);
        setTimeoutCountdown(0);
        // In manual mode, don't auto-advance - just stop listening
      }, autoRecordTimeout * 1000);
    }
  }, [isMyLine, speechRecognitionSupported, startListening, stopListening, autoRecordTimeout]);

  const startAutoMode = useCallback(() => {
    console.log('🚀 Starting AUTO MODE with actor-friendly timing');
    
    resetTranscript();
    clearAllTimeouts();
    stop();
    stopListening();
    
    setIsWaitingForUser(false);
    setShowingResult(false);
    setWaitingForSpeech(false);
    setSpeechStarted(false);
    setTimeoutCountdown(0);
    setIsAutoMode(true);
    pendingAdvanceRef.current = false;
    
    // Give more time for state to settle and refs to be properly set
    const initialTimeout = setTimeout(() => {
      console.log('🎬 Auto mode initialization complete, processing first line');
      // Use a ref to avoid circular dependency
      if (processLineAtIndexRef.current) {
        processLineAtIndexRef.current(currentGlobalLineIndex);
      } else {
        console.log('⚠️ processLineAtIndexRef not ready, retrying...');
        // Retry after a short delay if ref is not ready
        setTimeout(() => {
          if (processLineAtIndexRef.current) {
            processLineAtIndexRef.current(currentGlobalLineIndex);
          } else {
            console.error('❌ processLineAtIndexRef still not ready after retry');
          }
        }, 200);
      }
    }, 500); // Increased from 300ms to 500ms
    addTimeout(initialTimeout);
  }, [resetTranscript, clearAllTimeouts, stop, stopListening, currentGlobalLineIndex, addTimeout]);

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
      
      hiddenWordsMap.current.set(cacheKey, hiddenIndices);
    }
    
    return hiddenWordsMap.current.get(cacheKey) || new Set();
  }, []);

  const processLineAtIndex = useCallback((lineIndex: number) => {
    console.log(`🎬 processLineAtIndex called with lineIndex: ${lineIndex}, isAutoMode: ${isAutoMode}`);
    
    const line = lines[lineIndex];
    if (!line) {
      console.log('❌ No line to process');
      setIsAutoMode(false);
      return;
    }

    console.log(`🎬 Processing line ${lineIndex + 1}/${lines.length}: ${line.character} - "${line.text.substring(0, 50)}..."`);

    clearAllTimeouts();
    setIsWaitingForUser(false);
    setShowingResult(false);
    setWaitingForSpeech(false);
    setSpeechStarted(false);
    setTimeoutCountdown(0);
    resetTranscript();

    setPlayedLines(prev => new Set([...prev, lineIndex]));

    if (line.character === selectedCharacter) {
      console.log('🎤 User line - will be handled by consolidated useEffect');
      // The consolidated useEffect will handle this case
    } else {
      console.log('🗣️ Other character line - starting TTS');
      setWaitingForSpeech(true);
      setSpeechStarted(false);
      const characterVoiceSettings = getCharacterVoiceSettings(line.character);
      
      const ttsTimeout = setTimeout(() => {
        speak(line.text, characterVoiceSettings, language);
      }, 200);
      addTimeout(ttsTimeout);
      
      // Fallback timeout
      speechRecoveryTimeoutRef.current = setTimeout(() => {
        console.log('🚨 Speech recovery timeout');
        if (waitingForSpeech && !isSpeaking) {
          setWaitingForSpeech(false);
          setSpeechStarted(false);
          if (isAutoMode) {
            // Use ref to avoid circular dependency
            if (moveToNextLineRef.current) {
              moveToNextLineRef.current();
            }
          }
        }
      }, 10000);
    }
  }, [lines, selectedCharacter, getCharacterVoiceSettings, speak, language, clearAllTimeouts, resetTranscript, addTimeout, waitingForSpeech, isSpeaking, isAutoMode]);

  const stopAutoMode = useCallback(() => {
    console.log('🛑 Stopping AUTO MODE');
    setIsAutoMode(false);
    setIsAutoPaused(true);
    pendingAdvanceRef.current = false;
    setIsWaitingForUser(false);
    setShowingResult(false);
    setWaitingForSpeech(false);
    setSpeechStarted(false);
    stop();
    stopListening();
    clearAllTimeouts();
    setTimeoutCountdown(0);
    
    // Save progress when stopping auto mode
    setTimeout(saveProgressToLocalStorage, 100);
  }, [stop, stopListening, clearAllTimeouts, saveProgressToLocalStorage]);



  const handleManualNext = () => {
    if (currentGlobalLineIndex < lines.length - 1) {
      clearAllTimeouts();
      setShowingResult(false);
      if (moveToNextLineRef.current) {
        moveToNextLineRef.current();
      }
    }
  };

  const handleManualPrev = () => {
    if (currentGlobalLineIndex > 0) {
      clearAllTimeouts();
      stop();
      stopListening();
      
      setPlayedLines(prev => {
        const newPlayed = new Set(prev);
        newPlayed.delete(currentGlobalLineIndex - 1);
        return newPlayed;
      });
      
      setCurrentGlobalLineIndex(prev => prev - 1);
      setIsWaitingForUser(false);
      setShowingResult(false);
      setWaitingForSpeech(false);
      setSpeechStarted(false);
      resetTranscript();
      
      // Save progress on manual navigation
      setTimeout(saveProgressToLocalStorage, 100);
    }
  };

  const handleRetryLine = () => {
    if (myLineIndex >= 0) {
      resetTranscript();
      setShowingResult(false);
      setAccuracyScores(prev => {
        const newScores = { ...prev };
        delete newScores[myLineIndex];
        return newScores;
      });
      setCompletedLines(prev => {
        const newCompleted = new Set(prev);
        newCompleted.delete(myLineIndex);
        return newCompleted;
      });
      
      // Save progress after retry
      setTimeout(saveProgressToLocalStorage, 100);
      
      if (isMyLine && speechRecognitionSupported) {
        setIsWaitingForUser(true);
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
    console.log(`🚀 Moving to next line: ${currentGlobalLineIndex + 1} -> ${currentGlobalLineIndex + 2}`);
    
    // Save progress before moving
    saveProgressToLocalStorage();
    
    if (currentGlobalLineIndex >= lines.length - 1) {
      console.log('🏁 End of script reached');
      setIsAutoMode(false);
      pendingAdvanceRef.current = false;
      return;
    }

    const nextLineIndex = currentGlobalLineIndex + 1;
    
    clearAllTimeouts();
    stop();
    stopListening();
    
    // Reset states
    setIsWaitingForUser(false);
    setTimeoutCountdown(0);
    setShowingResult(false);
    setWaitingForSpeech(false);
    setSpeechStarted(false);
    resetTranscript();
    setCurrentGlobalLineIndex(nextLineIndex);
    
    // Reset pending flag
    setTimeout(() => {
      pendingAdvanceRef.current = false;
    }, 100);
    
    // Continue auto mode if active and not paused
    if (isAutoMode && !isAutoPaused) {
      const autoPlayTimeout = setTimeout(() => {
        if (isAutoMode && !isAutoPaused && processLineAtIndexRef.current) {
          processLineAtIndexRef.current(nextLineIndex);
        }
      }, 400);
      addTimeout(autoPlayTimeout);
    }
  }, [currentGlobalLineIndex, lines.length, clearAllTimeouts, stop, stopListening, resetTranscript, addTimeout, isAutoMode, isAutoPaused, saveProgressToLocalStorage]);

  // Create refs to avoid circular dependencies
  const processLineAtIndexRef = useRef(processLineAtIndex);
  const moveToNextLineRef = useRef(moveToNextLine);

  // Update refs when functions change
  useEffect(() => {
    processLineAtIndexRef.current = processLineAtIndex;
    console.log('🔄 processLineAtIndexRef updated');
  }, [processLineAtIndex]);

  useEffect(() => {
    moveToNextLineRef.current = moveToNextLine;
    console.log('🔄 moveToNextLineRef updated');
  }, [moveToNextLine]);

  // Speech synthesis completion effect
  useEffect(() => {
    if (waitingForSpeech && isAutoMode && !isMyLine && currentLine) {
      if (isSpeaking && !speechStarted) {
        console.log('🔊 TTS started');
        setSpeechStarted(true);
        
        if (speechRecoveryTimeoutRef.current) {
          clearTimeout(speechRecoveryTimeoutRef.current);
          speechRecoveryTimeoutRef.current = null;
        }
      } else if (!isSpeaking && speechStarted) {
        console.log('🔇 TTS completed, advancing');
        setWaitingForSpeech(false);
        setSpeechStarted(false);
        
        if (speechRecoveryTimeoutRef.current) {
          clearTimeout(speechRecoveryTimeoutRef.current);
          speechRecoveryTimeoutRef.current = null;
        }
        
        const nextLineTimeout = setTimeout(() => {
          if (isAutoMode && !isAutoPaused && moveToNextLineRef.current) {
            moveToNextLineRef.current();
          }
        }, 300);
        addTimeout(nextLineTimeout);
      }
    }
  }, [waitingForSpeech, isSpeaking, speechStarted, isMyLine, currentLine, addTimeout, isAutoMode, isAutoPaused]);

  // This single, consolidated useEffect manages the entire lifecycle of a user's line
  useEffect(() => {
    // Only run this logic when it's the user's turn to speak and we're in auto mode and not paused
    if (isMyLine && isAutoMode && !isAutoPaused && !isWaitingForUser && !showingResult) {
      
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
      setIsWaitingForUser(true);
      setTimeoutCountdown(autoRecordTimeout); // Use dynamic timeout
      
      // 3. Start listening for the user's speech
      console.log('🎤 Starting speech recognition with actor-friendly timeout');
      startListening();

      // 4. Start countdown display
      countdownIntervalRef.current = setInterval(() => {
        setTimeoutCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, COUNTDOWN_UPDATE_INTERVAL_MS);

      // 5. Set a fresh timeout for the current line
      console.log(`⏰ Setting up actor-friendly user line timeout: ${autoRecordTimeout} seconds`);
      userTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Actor timeout reached - no speech was detected in generous time window.');
        
        // Clear countdown
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setTimeoutCountdown(0);
        
        // Stop recognition and handle timeout
        stopListening();
        setIsWaitingForUser(false);
        
        if (isAutoMode) {
          console.log('🚀 Auto mode: Moving to next line after generous timeout.');
          handleAccuracyResult(0); // Score 0 and advance
        }
        
        userTimeoutRef.current = null;
      }, autoRecordTimeout * 1000); // Use dynamic timeout
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
  }, [currentGlobalLineIndex, isMyLine, isAutoMode, isAutoPaused, isWaitingForUser, showingResult, autoRecordTimeout, startListening, stopListening]); // Removed handleAccuracyResult from deps

  // This separate, simple effect handles CANCELLING the timeout as soon as speech is detected
  useEffect(() => {
    if (isSpeechDetected && userTimeoutRef.current) {
      console.log('🗣️ Speech detected! Cancelling the generous timeout - actor is speaking.');
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
      
      // Also clear the countdown since we detected speech
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setTimeoutCountdown(0);
    }
  }, [isSpeechDetected]);
  
  // This effect handles processing the FINAL transcript after the user has finished speaking
  useEffect(() => {
    console.log(`🔍 Transcript processing check: transcript="${transcript}", isMyLine=${isMyLine}, currentLine=${!!currentLine}, isWaitingForUser=${isWaitingForUser}`);
    
    if (transcript && isMyLine && currentLine && isWaitingForUser) {
      console.log(`✅ Final transcript received: "${transcript}". Processing accuracy.`);
      
      // Clear any lingering timeouts
      if (userTimeoutRef.current) {
        clearTimeout(userTimeoutRef.current);
        userTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      setIsWaitingForUser(false);
      setTimeoutCountdown(0);
      
      const accuracy = calculateAccuracy(currentLine.text, transcript, accuracyLevel);
      // setLastUserLineAccuracy(accuracy); // Store the last real accuracy result
      // setLastUserLineIndex(currentGlobalLineIndex); // Store the line index
      console.log(`📊 Calculated accuracy: ${accuracy}% for line "${currentLine.text.substring(0, 50)}..."`);
      handleAccuracyResult(accuracy);
      resetTranscript(); // Clear the transcript for the next line
    } else if (transcript && !isWaitingForUser) {
      console.log(`⚠️ Transcript received but not waiting for user: transcript="${transcript}", isMyLine=${isMyLine}, currentLine=${!!currentLine}, isWaitingForUser=${isWaitingForUser}`);
    }
  }, [transcript, isMyLine, currentLine, isWaitingForUser, accuracyLevel]); // Runs only when a new transcript is available

  // Advance immediately when recognition ends and no transcript is present (no fallback timeout)
  useEffect(() => {
    if (isMyLine && isWaitingForUser && !isListening && !transcript && isAutoMode && !isAutoPaused) {
      setIsWaitingForUser(false);
      setTimeoutCountdown(0);
      handleAccuracyResult(0);
    }
  }, [isListening, isMyLine, isWaitingForUser, transcript, isAutoMode, isAutoPaused]);

  // When moving to a new user line, keep the last icon until a new real result is available
  // useEffect(() => {
  //   if (isMyLine && currentGlobalLineIndex !== lastUserLineIndex) {
  //     // Clear the icon for a new user line until a real result is available
  //     setLastUserLineAccuracy(null);
  //     setLastUserLineIndex(null);
  //   }
  // }, [isMyLine, currentGlobalLineIndex, lastUserLineIndex]);

  // 🔥 --- END OF CONSOLIDATED TIMEOUT FIX --- 🔥

  // Character colors - memoized
  const characterColors = useMemo(() => {
    const palette = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ];
    const characterMap: { [key: string]: string } = {};
    const uniqueCharacters = Array.from(new Set(lines.map(line => line.character)));
    uniqueCharacters.forEach((character, index) => {
      if (character === selectedCharacter) {
        // Actor's bubble: always muted background, foreground text
        characterMap[character] = 'bg-muted text-foreground';
      } else {
        // Other characters: unique color, always white text for contrast
        characterMap[character] = `${palette[index % palette.length]} text-white`;
      }
    });
    return characterMap;
  }, [lines, selectedCharacter]);

  const overallPerformance = useMemo(() => {
    if (Object.keys(accuracyScores).length === 0) return 'Perfect';
    
    const scores = Object.values(accuracyScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 70) return 'Perfect';
    if (averageScore >= 40) return 'Not Bad';
    return 'Can Be Better';
  }, [accuracyScores]);



  // Auto-scroll effect to keep current line in view
  const AUTO_SCROLL_START_INDEX = 5; // Only auto-scroll after this many lines
  useEffect(() => {
    if (currentGlobalLineIndex >= AUTO_SCROLL_START_INDEX) {
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
  }, [currentGlobalLineIndex, playedLines.size]);

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
      
      setCurrentGlobalLineIndex(lineIndex);
      setIsWaitingForUser(false);
      setShowingResult(false);
      setWaitingForSpeech(false);
      setSpeechStarted(false);
      setTimeoutCountdown(0);
      resetTranscript();
      setPlayedLines(new Set());
      
      // Save progress after scene jump
      setTimeout(saveProgressToLocalStorage, 100);
    }
  }, [lines, clearAllTimeouts, stop, stopListening, resetTranscript, saveProgressToLocalStorage]);

  // Handle accuracy result
  const handleAccuracyResult = useCallback((accuracy: number) => {
    console.log(`📊 Accuracy result: ${accuracy}% for line ${myLineIndex} - Auto mode: ${isAutoMode}`);
    
    if (myLineIndex >= 0) {
      setAccuracyScores(prev => ({ ...prev, [myLineIndex]: accuracy }));
      
      if (accuracy >= 70) {
        setCompletedLines(prev => new Set([...prev, myLineIndex]));
      }
      
      // Save progress immediately after accuracy update
      setTimeout(saveProgressToLocalStorage, 50);
    }
    
    setShowingResult(true);
    
    const displayTime = isAutoMode ? 600 : 1200;
    
    const resultTimeout = setTimeout(() => {
      console.log('⏰ Result timeout - continuing');
      setShowingResult(false);
      if (isAutoMode) {
        console.log('🚀 Auto mode - moving to next line');
        moveToNextLine();
      }
    }, displayTime);
    
    addTimeout(resultTimeout);
  }, [myLineIndex, addTimeout, isAutoMode, saveProgressToLocalStorage]);

  const toggleAutoPause = useCallback(() => {
    if (isAutoPaused) {
      console.log('▶️ Resuming auto mode');
      setIsAutoPaused(false);
      // If we're currently on a user line and waiting, start listening
      if (isMyLine && !isWaitingForUser && !showingResult) {
        console.log('🎤 Auto-resuming speech recognition for current user line');
        setIsWaitingForUser(true);
        startListening();
        // Set up the timeout for the current line
        if (userTimeoutRef.current) {
          clearTimeout(userTimeoutRef.current);
        }
        console.log(`⏰ Setting up actor-friendly timeout: ${autoRecordTimeout} seconds`);
        userTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Actor timeout reached - no speech was detected in generous time window.');
          stopListening();
          setIsWaitingForUser(false);
          handleAccuracyResult(0); // Score 0 and advance
          userTimeoutRef.current = null;
        }, autoRecordTimeout * 1000);
      } else if (!isWaitingForUser && !showingResult && processLineAtIndexRef.current) {
        // If nothing has started yet, trigger the first line
        console.log('▶️ Starting first line in auto mode after pause');
        processLineAtIndexRef.current(currentGlobalLineIndex);
      }
    } else {
      console.log('⏸️ Pausing auto mode');
      setIsAutoPaused(true);
      // Stop current speech recognition if active
      if (isWaitingForUser) {
        stopListening();
        setIsWaitingForUser(false);
        if (userTimeoutRef.current) {
          clearTimeout(userTimeoutRef.current);
          userTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setTimeoutCountdown(0);
      }
    }
  }, [isAutoPaused, isMyLine, isWaitingForUser, showingResult, startListening, stopListening, autoRecordTimeout, handleAccuracyResult, currentGlobalLineIndex]);

  // Auto-start voice recognition when navigating to user lines in manual mode
  useEffect(() => {
    if (!isAutoMode && isMyLine && !isWaitingForUser && !showingResult) {
      const autoVoiceTimeout = setTimeout(() => {
        handleManualLinePlay();
      }, 500);
      return () => clearTimeout(autoVoiceTimeout);
    }
  }, [currentGlobalLineIndex, isAutoMode, isMyLine, isWaitingForUser, showingResult, handleManualLinePlay]);

  // ONLY communicate with parent when EXITING the session
  const handleBack = useCallback(() => {
    console.log('🔙 Exiting session - notifying parent of final progress');
    
    // Save to localStorage first
    saveProgressToLocalStorage();
    
    // Create final progress object for parent
    if (currentLine && selectedCharacter) {
      const finalProgress: UserProgress = {
        scriptId: scriptTitle,
        character: selectedCharacter,
        lastActNumber: currentLine.actNumber || 1,
        lastSceneNumber: currentLine.sceneNumber || 1,
        lastLineIndex: currentGlobalLineIndex,
        completedLines: Array.from(completedLines),
        accuracyScores: accuracyScores
      };
      
      // Only now do we communicate with the parent
      onProgressUpdate(finalProgress);
    }
    
    // Small delay to ensure progress is saved before navigating
    setTimeout(() => onBack(), 100);
  }, [saveProgressToLocalStorage, currentLine, selectedCharacter, scriptTitle, currentGlobalLineIndex, completedLines, accuracyScores, onProgressUpdate, onBack]);

  const renderLineText = (line: ScriptLine, isCurrentLine: boolean) => {
    if (line.character !== selectedCharacter) {
      return line.text;
    }

    if (!isCurrentLine || hideLevel === 'show-all') {
      return line.text;
    }

    if (hideLevel === 'hide-all') {
      return `••• ${t('practice.yourLine')} •••`;
    }

    // Use percentage-based hiding
    const words = line.text.split(' ');
    const hiddenIndices = getHiddenWords(line.text, line.id, hideLevel);
    
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
    const currentAct = currentLine?.actNumber || 1;
    const currentScene = currentLine?.sceneNumber || 1;

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
  const allLinesCompleted = currentGlobalLineIndex >= lines.length - 1 && !isAutoMode;

  if (allLinesCompleted && completedLines.size === myLines.length) {
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
              <span className="text-gray-600 ml-2">({Math.round(progress)}%)</span>
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
    <div className="min-h-screen flex flex-col bg-background">
      <PracticeHeader
        scriptTitle={scriptTitle}
        selectedCharacter={selectedCharacter}
        hideLevel={hideLevel}
        setHideLevel={setHideLevel}
        showHideDropdown={showHideDropdown}
        setShowHideDropdown={setShowHideDropdown}
        t={t}
        hiddenWordsMap={hiddenWordsMap}
        onBack={handleBack}
      />

      {/* Chat Messages Area - Takes most of the space */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 scroll-smooth bg-card text-card-foreground border-t border-border"
        style={{ paddingBottom: '320px' }} // Reduced space since we removed redundant info
      >
        {lines.slice(0, currentGlobalLineIndex + 1).map((line, index) => {
          const isCurrentLine = index === currentGlobalLineIndex;
          const isUserLine = line.character === selectedCharacter;
          const hasPlayed = playedLines.has(index) || isCurrentLine;
          const lineAccuracy = isUserLine ? accuracyScores[myLines.findIndex(l => l.id === line.id)] : undefined;
          
          if (!hasPlayed && !isCurrentLine) return null;

          return (
            <div key={line.id} ref={isCurrentLine ? currentLineRef : null}>
              {/* Character Name Label */}
              <div className={`flex items-center space-x-2 mb-2 text-muted-foreground ${
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
                {isUserLine && lineAccuracy !== undefined && (!isCurrentLine || (!isWaitingForUser && isCurrentLine)) && (
                  <div className="flex-shrink-0 mt-2">
                    {renderUserLineResultIcon(lineAccuracy)}
                    {!isAutoMode && (
                      <button
                        onClick={handleRetryLine}
                        className="block mx-auto mt-1 p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        title="Retry"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Speech Bubble - Enhanced with improved readability */}
                <div 
                  className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-sm ${characterColors[line.character]} ${isCurrentLine ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}
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
                          {isWaitingForUser ? (
                            isListening ? (
                              <div className="flex items-center space-x-1 text-red-400">
                                <Mic className="w-3 h-3" />
                                <div className={`w-2 h-2 rounded-full ${
                                  transcript 
                                    ? 'bg-green-500' // Speech detected
                                    : 'bg-red-500 animate-pulse' // Listening for speech
                                }`} />
                                <span>Recording...</span>
                                {isSpeechDetected && (
                                  <span className="text-green-400 ml-1">✓ Speech detected</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-yellow-400">
                                <Mic className="w-3 h-3" />
                                <span>Ready to speak</span>
                              </div>
                            )
                          ) : !isAutoMode && speechRecognitionSupported && (
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Mic className="w-3 h-3" />
                              <span>Tap to start recording</span>
                            </div>
                          )}
                          
                          {/* Generous timeout countdown */}
                          {timeoutCountdown > 0 && !isSpeechDetected && isAutoMode && isUserLine && (
                            <div className="flex items-center space-x-1 text-orange-400">
                              <Clock className="w-3 h-3" />
                              <span>{timeoutCountdown}s generous time</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Other Character TTS Status */}
                      {!isUserLine && (
                        waitingForSpeech ? (
                          <div className="flex items-center space-x-1 text-xs text-blue-400">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>
                              {isSpeaking ? 'Speaking...' : 'Starting...'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setWaitingForSpeech(true);
                              setSpeechStarted(false);
                              const characterVoiceSettings = getCharacterVoiceSettings(line.character);
                              speak(line.text, characterVoiceSettings, language);
                            }}
                            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-600 transition-colors duration-200"
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
        progress={progress}
        completedLines={completedLines}
        myLines={myLines}
        currentGlobalLineIndex={currentGlobalLineIndex}
        lines={lines}
        handleManualPrev={handleManualPrev}
        handleManualNext={handleManualNext}
        practiceMode={practiceMode}
        setPracticeMode={() => {}} // Not used in old practice screen
        isAutoPaused={isAutoPaused}
        stopAutoMode={stopAutoMode}
        startAutoMode={startAutoMode}
        toggleAutoPause={toggleAutoPause}
        t={t}
        speechRecognitionSupported={speechRecognitionSupported}
        SceneNavigatorComponent={SceneNavigatorComponent}
      />
    </div>
  );
};