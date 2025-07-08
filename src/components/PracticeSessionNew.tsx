import React, { useEffect, useRef, useMemo } from 'react';
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
  FileText,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Eye,
  EyeOff
} from 'lucide-react';
import { ScriptLine, Character, UserProgress } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { usePracticeEngine, UsePracticeEngineProps } from '../hooks/usePracticeEngine';
import PracticeHeader from './PracticeHeader';
import PracticeFooter from './PracticeFooter';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Props for the new practice session component
interface PracticeSessionNewProps {
  // Scene-specific props (only current scene lines)
  lines: ScriptLine[];
  characters: Character[];
  selectedCharacter: string;
  scriptTitle: string;
  accuracyLevel: 'exact' | 'semantic' | 'loose';
  voiceSettings: { rate: number; volume: number; voiceIndex: number };
  language: string;
  autoRecordTimeout: number;
  startingLineIndex: number;
  practiceMode: 'auto' | 'manual';
  setPracticeMode: (mode: 'auto' | 'manual') => void;
  template?: 'chat' | 'classic' | 'large-print' | 'teleprompter' | 'theatre';
  
  // Callbacks for scene navigation
  onSceneComplete: () => void;
  onGoToPreviousScene: () => void;
  onBack: () => void;
  onProgressUpdate: (progress: UserProgress) => void;
  
  // Speech synthesis props
  speak: (text: string, settings: { rate: number; volume: number; voiceIndex: number }, language?: string) => void;
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

// Add HideLevel type at the top
type HideLevel = 'show-all' | 'hide-15' | 'hide-30' | 'hide-50' | 'hide-all';

export const PracticeSessionNew: React.FC<PracticeSessionNewProps> = ({
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
  setPracticeMode,
  onSceneComplete,
  onGoToPreviousScene,
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
  isSpeechDetected,
  template = 'chat',
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Refs for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  
  // Prepare props for the practice engine
  const engineProps: UsePracticeEngineProps = {
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
  };
  
  // Use the practice engine hook
  const { state, actions, saveProgressToLocalStorage } = usePracticeEngine(engineProps);
  
  // Calculate derived state
  const currentLine = useMemo(() => lines[state.currentLineIndex], [lines, state.currentLineIndex]);
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
    myLines.length > 0 ? (state.completedLines.size / myLines.length) * 100 : 0,
    [myLines.length, state.completedLines.size]
  );
  
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
    if (Object.keys(state.accuracyScores).length === 0) return 'Perfect';
    
    const scores = Object.values(state.accuracyScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 70) return 'Perfect';
    if (averageScore >= 40) return 'Not Bad';
    return 'Can Be Better';
  }, [state.accuracyScores]);

  // State for hide level (simplified for now)
  const [hideLevel, setHideLevel] = React.useState<'show-all' | 'hide-15' | 'hide-30' | 'hide-50' | 'hide-all'>('show-all');
  const [showHideDropdown, setShowHideDropdown] = React.useState(false);
  const hiddenWordsMap = useRef<Map<string, Set<number>>>(new Map());

  // Add display mode state at the top of the component
  const [displayMode, setDisplayMode] = React.useState<'full' | 'progressive'>('full');

  // Add at the top of the component:
  const AUTO_SCROLL_START_INDEX = 0;

  // Add a derived state for isPracticing
  const isPracticing = state.isPlaying;

  // Helper to get hidden word indices for a line and hideLevel
  const getHiddenWords = (
    text: string,
    lineId: string,
    hideLevel: HideLevel
  ): Set<number> => {
    if (hideLevel === 'show-all') return new Set();
    if (hideLevel === 'hide-all') {
      const words = text.split(' ');
      return new Set(Array.from({ length: words.length }, (_, i) => i));
    }
    // Use a cache for consistent hiding
    const cacheKey = `${lineId}-${hideLevel}`;
    if (!hiddenWordsMap.current.has(cacheKey)) {
      const words = text.split(' ');
      const totalWords = words.length;
      let hidePercentage = 0;
      switch (hideLevel) {
        case 'hide-15': hidePercentage = 0.15; break;
        case 'hide-30': hidePercentage = 0.30; break;
        case 'hide-50': hidePercentage = 0.50; break;
      }
      const wordsToHide = Math.floor(totalWords * hidePercentage);
      // Only hide words longer than 2 chars
      const availableIndices = words
        .map((word, index) => ({ word, index }))
        .filter(({ word }) => word.length > 2)
        .map(({ index }) => index);
      let hiddenIndices: Set<number> = new Set();
      if (availableIndices.length > 0 && wordsToHide > 0) {
        // Try to pick non-adjacent indices first (even or odd)
        let evenIndices = availableIndices.filter(i => i % 2 === 0);
        let oddIndices = availableIndices.filter(i => i % 2 !== 0);
        let pickFrom: number[] = [];
        if (evenIndices.length >= wordsToHide) {
          pickFrom = evenIndices;
        } else if (oddIndices.length >= wordsToHide) {
          pickFrom = oddIndices;
        } else {
          // If neither is enough, shuffle and pick with minimal adjacency
          pickFrom = [...availableIndices];
          for (let i = pickFrom.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pickFrom[i], pickFrom[j]] = [pickFrom[j], pickFrom[i]];
          }
        }
        // Randomly select from pickFrom
        let selected = new Set<number>();
        let attempts = 0;
        while (selected.size < wordsToHide && attempts < 10 * wordsToHide) {
          const idx = pickFrom[Math.floor(Math.random() * pickFrom.length)];
          // Avoid selecting neighbors if possible
          if (!selected.has(idx) && !selected.has(idx - 1) && !selected.has(idx + 1)) {
            selected.add(idx);
          }
          attempts++;
        }
        // If not enough, fill up with any remaining
        if (selected.size < wordsToHide) {
          for (let idx of pickFrom) {
            if (selected.size >= wordsToHide) break;
            selected.add(idx);
          }
        }
        hiddenIndices = selected;
      }
      hiddenWordsMap.current.set(cacheKey, hiddenIndices);
    }
    return hiddenWordsMap.current.get(cacheKey) || new Set();
  };

  // Helper to render character name(s) for a line
  const renderCharacterNames = (character: string | string[]) => {
    if (Array.isArray(character)) {
      return character.join(' / ');
    }
    return character;
  };

  // Render line text with hiding support
  const renderLineText = (line: ScriptLine, isCurrentLine: boolean) => {
    if (line.character !== selectedCharacter) {
      return line.text;
    }
    // Hiding logic for actor's lines
    if (hideLevel === 'show-all') {
      return line.text;
    }
    if (hideLevel === 'hide-all') {
      return `••• ${t('practice.yourLine')} •••`;
    }
    // Hide a percentage of words, show only underscores
    const words = line.text.split(' ');
    const hiddenIndices = getHiddenWords(line.text, line.id, hideLevel as HideLevel);
    return words.map((word, idx) => {
      if (hiddenIndices.has(idx)) {
        return '_'.repeat(Math.max(2, word.length));
      }
      return word;
    }).join(' ');
  };

  // Render user line result icon
  const renderUserLineResultIcon = (accuracy: number | undefined) => {
    if (accuracy === undefined || accuracy === null) return null;
    if (accuracy >= 70) return <span title="Great!" className="ml-2 text-green-600 text-xl">😊</span>;
    if (accuracy >= 40) return <span title="Not bad" className="ml-2 text-yellow-600 text-xl">😐</span>;
    return <span title="Keep practicing!" className="ml-2 text-orange-600 text-xl">😞</span>;
  };

  // Scene Navigator Component
  const SceneNavigatorComponent = () => {
    const currentAct = currentLine?.actNumber || 1;
    const currentScene = currentLine?.sceneNumber || 1;

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
        const firstSceneInPrevAct = Math.min(...scenesInCurrentAct);
        const lineIndex = lines.findIndex(line => 
          (line.actNumber || 1) === prevAct && (line.sceneNumber || 1) === firstSceneInPrevAct
        );
        if (lineIndex !== -1) {
          actions.jumpToLine(lineIndex);
        }
      }
    };

    const goToNextAct = () => {
      if (canGoNextAct) {
        const nextAct = acts[currentActIndex + 1];
        const firstSceneInNextAct = Math.min(...scenesInCurrentAct);
        const lineIndex = lines.findIndex(line => 
          (line.actNumber || 1) === nextAct && (line.sceneNumber || 1) === firstSceneInNextAct
        );
        if (lineIndex !== -1) {
          actions.jumpToLine(lineIndex);
        }
      }
    };

    const goToPreviousScene = () => {
      if (canGoPrevScene) {
        const prevScene = scenesInCurrentAct[currentSceneIndex - 1];
        const lineIndex = lines.findIndex(line => 
          (line.actNumber || 1) === currentAct && (line.sceneNumber || 1) === prevScene
        );
        if (lineIndex !== -1) {
          actions.jumpToLine(lineIndex);
        }
      }
    };

    const goToNextScene = () => {
      if (canGoNextScene) {
        const nextScene = scenesInCurrentAct[currentSceneIndex + 1];
        const lineIndex = lines.findIndex(line => 
          (line.actNumber || 1) === currentAct && (line.sceneNumber || 1) === nextScene
        );
        if (lineIndex !== -1) {
          actions.jumpToLine(lineIndex);
        }
      }
    };

    return (
      <div className="flex items-center justify-center space-x-2 p-2 bg-muted/50 rounded-lg">
        <button
          onClick={goToPreviousAct}
          disabled={!canGoPrevAct}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous Act"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-medium">Act {currentAct}</span>
        
        <button
          onClick={goToNextAct}
          disabled={!canGoNextAct}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Act"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-border" />
        
        <button
          onClick={goToPreviousScene}
          disabled={!canGoPrevScene}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous Scene"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-medium">Scene {currentScene}</span>
        
        <button
          onClick={goToNextScene}
          disabled={!canGoNextScene}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Scene"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Auto-scroll effect to keep current line in the vertical center of the chat container
  useEffect(() => {
    if (state.currentLineIndex >= AUTO_SCROLL_START_INDEX) {
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
  }, [state.currentLineIndex]);

  // Handle manual navigation
  const handleManualNext = () => {
    if (state.currentLineIndex < lines.length - 1) {
      actions.nextLine();
    }
  };

  const handleManualPrev = () => {
    if (state.currentLineIndex > 0) {
      actions.previousLine();
    }
  };

  const handleRetryLine = () => {
    if (myLineIndex >= 0) {
      resetTranscript();
      // Reset accuracy for current line - this would need a new action in the reducer
      // For now, we'll handle this by dispatching a custom action
      // actions.retryLine();
    }
  };

  // Handle back navigation with progress saving
  const handleBack = () => {
    saveProgressToLocalStorage();
    
    if (currentLine && selectedCharacter) {
      const finalProgress: UserProgress = {
        scriptId: scriptTitle,
        character: selectedCharacter,
        lastActNumber: currentLine.actNumber || 1,
        lastSceneNumber: currentLine.sceneNumber || 1,
        lastLineIndex: state.currentLineIndex,
        completedLines: Array.from(state.completedLines),
        accuracyScores: state.accuracyScores
      };
      
      // Calculate average accuracy for this session
      const scores = Object.values(state.accuracyScores);
      const averageAccuracy = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      
      // Update character performance and script history
      if (averageAccuracy > 0) {
        // This would need to be passed down from parent component
        // For now, we'll handle this in the parent component
      }
      
      onProgressUpdate(finalProgress);
    }
    
    setTimeout(() => onBack(), 100);
  };

  // Add logic to load and save hideLevel to localStorage per scriptTitle/selectedCharacter
  React.useEffect(() => {
    // On mount, try to load hideLevel from localStorage
    const key = `hideLevel-${scriptTitle}-${selectedCharacter}`;
    const saved = localStorage.getItem(key);
    if (saved && ['show-all','hide-15','hide-30','hide-50','hide-all'].includes(saved)) {
      setHideLevel(saved as HideLevel);
    }
    // Save on change
  }, []);
  React.useEffect(() => {
    // Save hideLevel to localStorage when it changes
    const key = `hideLevel-${scriptTitle}-${selectedCharacter}`;
    localStorage.setItem(key, hideLevel);
  }, [hideLevel, scriptTitle, selectedCharacter]);

  // In the header area, add a toggle button for display mode
  // (Place this near the hide button, or in a new row if needed)
  // Example:
  // <Button onClick={() => setDisplayMode(displayMode === 'full' ? 'progressive' : 'full')}>
  //   {displayMode === 'full' ? 'Progressive Reveal' : 'Show Full Script'}
  // </Button>

  // In the chat container rendering, filter lines based on displayMode
  const visibleLines = displayMode === 'full'
    ? lines
    : lines.slice(0, state.currentLineIndex + 1);

  // Helper to get current act/scene for sticky header
  const currentAct = lines[state.currentLineIndex]?.actNumber || 1;
  const currentScene = lines[state.currentLineIndex]?.sceneNumber || 1;

  // Template rendering logic
  let mainContent;
  if (template === 'chat') {
    mainContent = (
      <div className="flex-1 flex flex-col">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          {visibleLines.map((line, index) => {
            const isCurrentLine = index === state.currentLineIndex;
            const isMyLine = line.character === selectedCharacter;
            const accuracy = state.accuracyScores[index];
            return (
              <div
                key={line.id}
                ref={isCurrentLine ? currentLineRef : null}
                className={`flex ${isMyLine ? 'justify-end' : 'justify-start'}`}
              >
                {/* Recording dot outside bubble for user lines */}
                {isCurrentLine && isMyLine && state.isPlaying && isListening && (
                  <div className="flex items-center mr-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isSpeechDetected 
                        ? 'bg-green-500' // User is speaking
                        : 'bg-red-500 animate-pulse' // Waiting for speech
                    }`} />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] p-0 rounded-lg shadow-sm transition-all duration-200 border-0 ${
                    isCurrentLine 
                      ? isMyLine && state.isPlaying && isListening
                        ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${characterColors[line.character] || 'bg-gray-500 text-white'}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge 
                        variant={isMyLine ? 'default' : 'outline'} 
                        className={`text-xs font-medium opacity-75 ${!isMyLine ? characterColors[line.character].replace(/bg-\w+-\d+/, '').replace('text-white', '').trim() : ''}`}
                      >
                        {line.character}
                      </Badge>
                      {isMyLine && accuracy !== undefined && renderUserLineResultIcon(accuracy)}
                    </div>
                    <div className="text-base leading-relaxed">
                      {renderLineText(line, isCurrentLine)}
                    </div>
                    {isCurrentLine && state.showingResult && isMyLine && (
                      <div className="mt-2">
                        {renderUserLineResultIcon(state.resultAccuracy || 0)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (template === 'classic') {
    mainContent = (
      <div className="flex-1 flex flex-col">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          {visibleLines.map((line, index) => {
            const isMyLine = line.character === selectedCharacter;
            const isCurrentLine = index === state.currentLineIndex;
            const accuracy = state.accuracyScores[index];
            return (
              <div key={line.id} ref={isCurrentLine ? currentLineRef : null} className="">
                <div className="flex items-center mb-1">
                  {isCurrentLine && isMyLine && state.isPlaying && isListening && (
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: isSpeechDetected ? '#22c55e' : '#ef4444', animation: isSpeechDetected ? undefined : 'pulse 1s infinite' }}
                    />
                  )}
                  <span className={`font-bold text-base ${isMyLine ? 'text-primary' : 'text-muted-foreground'}`}>{renderCharacterNames(line.character)}</span>
                </div>
                <div className={`rounded-lg px-4 py-3 shadow-sm border ${isMyLine ? 'bg-primary/10 border-primary/30' : 'bg-muted border-border'} text-base leading-relaxed`}>{renderLineText(line, isCurrentLine)}
                  {isCurrentLine && state.showingResult && isMyLine && (
                    <span className="ml-2 align-middle">{renderUserLineResultIcon(state.resultAccuracy || 0)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (template === 'large-print') {
    mainContent = (
      <div className="flex-1 flex flex-col">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-10 bg-background">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          {visibleLines.map((line, index) => {
            const isMyLine = line.character === selectedCharacter;
            const isCurrentLine = index === state.currentLineIndex;
            const accuracy = state.accuracyScores[index];
            return (
              <div key={line.id} ref={isCurrentLine ? currentLineRef : null} className="">
                <div className="flex items-center mb-2">
                  {isCurrentLine && isMyLine && state.isPlaying && isListening && (
                    <span className="inline-block w-4 h-4 rounded-full mr-3 align-middle"
                      style={{ background: isSpeechDetected ? '#22c55e' : '#ef4444', animation: isSpeechDetected ? undefined : 'pulse 1s infinite' }}
                    />
                  )}
                  <span className={`font-bold text-2xl ${isMyLine ? 'text-primary' : 'text-muted-foreground'}`}>{line.character}</span>
                </div>
                <div className={`rounded-xl px-6 py-6 shadow border-2 ${isMyLine ? 'bg-primary/10 border-primary/40' : 'bg-muted border-border'} text-3xl leading-loose`}>{renderLineText(line, isCurrentLine)}
                  {isCurrentLine && state.showingResult && isMyLine && (
                    <span className="ml-4 align-middle text-3xl">{renderUserLineResultIcon(state.resultAccuracy || 0)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (template === 'teleprompter') {
    mainContent = (
      <div className="flex-1 flex flex-col items-center justify-center bg-black">
        <div
          ref={chatContainerRef}
          className="w-full max-w-4xl flex-1 overflow-y-auto px-4 py-8 relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          <div className="flex flex-col space-y-24">
            {visibleLines.map((line, index) => {
              const isMyLine = line.character === selectedCharacter;
              const isCurrentLine = index === state.currentLineIndex;
              return (
                <div
                  key={line.id}
                  ref={isCurrentLine ? currentLineRef : null}
                  className={`transition-all duration-300 px-2 ${isCurrentLine ? 'bg-yellow-100/10 ring-4 ring-primary/60 rounded-xl' : ''}`}
                >
                  <div className="flex items-center mb-4 justify-center">
                    {isCurrentLine && isMyLine && state.isPlaying && isListening && (
                      <span className="inline-block w-5 h-5 rounded-full mr-4 align-middle"
                        style={{ background: isSpeechDetected ? '#22c55e' : '#ef4444', animation: isSpeechDetected ? undefined : 'pulse 1s infinite' }}
                      />
                    )}
                    <div className={`font-bold text-4xl tracking-wide uppercase ${isCurrentLine ? 'text-primary' : 'text-muted-foreground'}`}>{line.character}</div>
                  </div>
                  <div className={`text-white text-5xl font-bold text-center w-full leading-[1.5] px-4 ${isCurrentLine ? 'drop-shadow-lg' : 'opacity-60'}`} style={{textShadow: '0 2px 8px #0008'}}>
                    {renderLineText(line, isCurrentLine)}
                    {isCurrentLine && state.showingResult && isMyLine && (
                      <span className="ml-8 align-middle text-4xl">{renderUserLineResultIcon(state.resultAccuracy || 0)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } else if (template === 'theatre') {
    mainContent = (
      <div className="flex-1 flex flex-col items-center justify-center bg-background font-mono">
        <div ref={chatContainerRef} className="w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8">
          {/* Act and Scene Headings */}
          {lines.length > 0 && (
            <>
              {lines[0].actNumber && (
                <div className="text-center mb-2">
                  <div className="text-2xl font-bold underline mb-2">ACT {lines[0].actNumber}</div>
                </div>
              )}
              {lines[0].sceneNumber && (
                <div className="text-center mb-6">
                  <div className="text-xl font-bold underline">Scene {lines[0].sceneNumber}</div>
                </div>
              )}
            </>
          )}
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          {/* Script Lines */}
          <div className="space-y-8">
            {visibleLines.map((line, index) => {
              // Stage directions: italic, centered, spaced
              if (line.character === 'STAGE' || line.character === 'DIRECTION' || /\(.*\)/.test(line.text) || /\[.*\]/.test(line.text)) {
                return (
                  <div key={line.id} className="text-center italic text-lg text-muted-foreground my-6">
                    {line.text}
                  </div>
                );
              }
              // Dialogue: character name uppercase, dialogue indented
              const isMyLine = line.character === selectedCharacter;
              const isCurrentLine = index === state.currentLineIndex;
              return (
                <div
                  key={line.id}
                  ref={isCurrentLine ? currentLineRef : null}
                  className={`transition-all duration-300 px-2 py-2 rounded-xl ${isCurrentLine ? 'border-4 border-primary ring-2 ring-primary/30 bg-primary/10' : 'border-4 border-background'} `}
                >
                  <div className={`mb-0`}> 
                    <div className="font-mono font-bold uppercase text-base tracking-widest text-left pl-2">{renderCharacterNames(line.character)}</div>
                  </div>
                  <div className={`text-xl leading-relaxed pl-8 whitespace-pre-line ${isMyLine ? 'text-primary' : 'text-foreground'}`}>{renderLineText(line, isCurrentLine)}
                    {isCurrentLine && state.showingResult && isMyLine && (
                      <span className="ml-4 align-middle text-2xl">{renderUserLineResultIcon(state.resultAccuracy || 0)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } else {
    // fallback to chat
    mainContent = (
      <div className="flex-1 flex flex-col">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-card/90 shadow border-b border-border py-2 mb-8 text-center rounded-b-xl backdrop-blur-lg">
            <span className="text-lg font-bold tracking-wide text-primary">ACT {currentAct}</span>
            <span className="mx-4 text-lg font-bold tracking-wide text-secondary">Scene {currentScene}</span>
          </div>
          {visibleLines.map((line, index) => {
            const isCurrentLine = index === state.currentLineIndex;
            const isMyLine = line.character === selectedCharacter;
            const accuracy = state.accuracyScores[index];
            return (
              <div
                key={line.id}
                ref={isCurrentLine ? currentLineRef : null}
                className={`flex ${isMyLine ? 'justify-end' : 'justify-start'}`}
              >
                {/* Recording dot outside bubble for user lines */}
                {isCurrentLine && isMyLine && state.isPlaying && isListening && (
                  <div className="flex items-center mr-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isSpeechDetected 
                        ? 'bg-green-500' // User is speaking
                        : 'bg-red-500 animate-pulse' // Waiting for speech
                    }`} />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] p-0 rounded-lg shadow-sm transition-all duration-200 border-0 ${
                    isCurrentLine 
                      ? isMyLine && state.isPlaying && isListening
                        ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${characterColors[line.character] || 'bg-gray-500 text-white'}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge 
                        variant={isMyLine ? 'default' : 'outline'} 
                        className={`text-xs font-medium opacity-75 ${!isMyLine ? characterColors[line.character].replace(/bg-\w+-\d+/, '').replace('text-white', '').trim() : ''}`}
                      >
                        {line.character}
                      </Badge>
                      {isMyLine && accuracy !== undefined && renderUserLineResultIcon(accuracy)}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {renderLineText(line, isCurrentLine)}
                    </div>
                    {isCurrentLine && state.showingResult && isMyLine && (
                      <div className="mt-2">
                        {renderUserLineResultIcon(state.resultAccuracy || 0)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Scroll current line into view for theatre mode
  useEffect(() => {
    if (template === 'theatre' && currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state.currentLineIndex, template]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
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
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      {/* Main Content */}
      {mainContent}

      {/* Footer */}
      <PracticeFooter
        progress={progress}
        completedLines={state.completedLines}
        myLines={myLines}
        currentGlobalLineIndex={state.currentLineIndex}
        lines={lines}
        handleManualPrev={handleManualPrev}
        handleManualNext={handleManualNext}
        isAutoPaused={!state.isPlaying}
        stopAutoMode={actions.stopAutoMode}
        startAutoMode={actions.startAutoMode}
        toggleAutoPause={!state.isPlaying ? actions.resume : actions.pause}
        t={t}
        speechRecognitionSupported={speechRecognitionSupported}
        SceneNavigatorComponent={SceneNavigatorComponent}
        practiceMode={practiceMode}
        setPracticeMode={setPracticeMode}
        showNavigation={!state.isPlaying}
      />
    </div>
  );
}; 