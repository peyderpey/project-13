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
  SkipBack
} from 'lucide-react';
import { ScriptLine, Character, UserProgress } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { usePracticeEngine, UsePracticeEngineProps } from '../hooks/usePracticeEngine';
import PracticeHeader from './PracticeHeader';
import PracticeFooter from './PracticeFooter';

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
  const [hideLevel, setHideLevel] = React.useState<'show-all' | 'hide-25' | 'hide-50' | 'hide-75' | 'hide-all'>('show-all');
  const [showHideDropdown, setShowHideDropdown] = React.useState(false);
  const hiddenWordsMap = useRef<Map<string, Set<number>>>(new Map());

  // Auto-scroll effect to keep current line in view
  const AUTO_SCROLL_START_INDEX = 5;
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

  // Render line text with hiding support
  const renderLineText = (line: ScriptLine, isCurrentLine: boolean) => {
    if (line.character !== selectedCharacter) {
      return line.text;
    }

    // For now, show all text - hiding can be added later
    return line.text;
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Status Bar */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Line {state.currentLineIndex + 1} of {lines.length}
              </span>
              
              {/* Recording Status Indicator */}
              {state.isPlaying && isListening && (
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <div className={`w-2 h-2 rounded-full ${
                    isSpeechDetected 
                      ? 'bg-green-500' // User is speaking
                      : 'bg-red-500 animate-pulse' // Waiting for speech
                  }`} />
                </div>
              )}
              
              {state.isPlaying && isListening && state.timeoutCountdown > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">
                    {state.timeoutCountdown}s
                  </span>
                </div>
              )}
              
              {state.isPlaying && isSpeaking && (
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">
                    {t('practice.listening')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {state.isAutoMode ? (
                <>
                  {!state.isPlaying ? (
                    <button
                      onClick={actions.resume}
                      className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={actions.pause}
                      className="flex items-center space-x-2 px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      <span className="text-sm">Pause</span>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Manual Mode</span>
              )}
            </div>
          </div>
        </div>

        {/* Scene Navigator */}
        <div className="px-4 py-2">
          <SceneNavigatorComponent />
        </div>

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {/* Render all scene lines */}
          {lines.map((line, index) => {
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
                <div
                  className={`max-w-[80%] p-3 rounded-lg shadow-sm transition-all duration-200 ${
                    isCurrentLine 
                      ? isMyLine && state.isPlaying && isListening
                        ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' // User's turn to speak (no pulse)
                        : 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' // Current line, not user's turn
                      : ''
                  } ${characterColors[line.character] || 'bg-gray-500 text-white'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-75">
                      {line.character}
                    </span>
                    {isMyLine && accuracy !== undefined && renderUserLineResultIcon(accuracy)}
                  </div>
                  
                  <div className="text-sm leading-relaxed">
                    {renderLineText(line, isCurrentLine)}
                  </div>
                  
                  {/* Accuracy result - icon only, no percentage */}
                  {isCurrentLine && state.showingResult && isMyLine && (
                    <div className="mt-2">
                      {renderUserLineResultIcon(state.resultAccuracy || 0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
      />
    </div>
  );
}; 