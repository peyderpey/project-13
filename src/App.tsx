import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { SideMenu } from './components/SideMenu';
import { ScriptUpload } from './components/ScriptUpload';
import { ScriptLibrary } from './components/ScriptLibrary';
import { CharacterSelection } from './components/CharacterSelection';
import { PracticeSession } from './components/PracticeSession';
import { PracticeSessionNew } from './components/PracticeSessionNew';
import { StartingPointSelector } from './components/StartingPointSelector';
import { Settings } from './components/Settings';
import { Character, ScriptLine, AccuracyLevel, VoiceSettings, getScriptLanguageInfo, UserProgress } from './types';
import { Language } from './i18n';
import { useTranslation } from './i18n/useTranslation';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useScripts } from './hooks/useScripts';
import { useAppSettings } from './hooks/useAppSettings';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card';
import { ThemeToggle } from './components/ThemeToggle';

type AppState = 'library' | 'upload' | 'character-selection' | 'starting-point' | 'practice';
type PracticeMode = 'auto' | 'manual';

function isLanguage(lang: string): lang is Language {
  return ['en','tr','de','fr','es','it'].includes(lang);
}

function App() {
  const { language: interfaceLanguage } = useTranslation();
  const { updateCharacterVoiceSettings } = useScripts();
  const [currentState, setCurrentState] = useState<AppState>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptLanguage, setScriptLanguage] = useState('en'); // Original language of the script
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showStartingPointSelector, setShowStartingPointSelector] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [startingLineIndex, setStartingLineIndex] = useState(0);
  const { settings, updateSettings, updateCharacterPerformance, updateScriptHistory } = useAppSettings();
  const [practiceMode, setPracticeMode] = useState<'auto' | 'manual'>(settings.autoAdvance ? 'auto' : 'manual');
  
  // Speech hooks - centralized in App
  const { voices, speak, stop, isSpeaking } = useSpeechSynthesis();
  
  // Memoize script language info to prevent recreating objects
  const scriptLanguageInfo = useMemo(() => getScriptLanguageInfo(scriptLanguage), [scriptLanguage]);
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechRecognitionSupported,
    isSpeechDetected // 🔥 ADD THIS - Now exposing speech detection state
  } = useSpeechRecognition(scriptLanguageInfo.speechCode);

  // 🔥 ENHANCED: Force language-specific voices for each character
  const shuffleVoicesForCharacters = useCallback((
    characters: Character[], 
    scriptLanguage: string
  ): Character[] => {
    const scriptLangInfo = getScriptLanguageInfo(scriptLanguage);
    
    // Get voices that match the script language
    const availableVoices = voices.filter(voice => {
      const langPrefix = scriptLangInfo.speechCode.split('-')[0].toLowerCase();
      const voiceLangPrefix = voice.lang.split('-')[0].toLowerCase();
      return voiceLangPrefix === langPrefix;
    });
    
    console.log('🎲 Voice shuffling:', {
      scriptLanguage,
      speechCode: scriptLangInfo.speechCode,
      totalVoices: voices.length,
      matchingVoices: availableVoices.length,
      charactersCount: characters.length
    });
    
    if (availableVoices.length === 0) {
      console.warn(`⚠️ No matching voices found for language '${scriptLanguage}', using default voices`);
      return characters.map(char => ({
        ...char,
        voiceSettings: {
          rate: 1.0,
          volume: 1.0,
          voiceIndex: 0
        }
      }));
    }

    // ✅ CRITICAL FIX: Get all current voice indices 
    const existingVoiceIndices = characters
      .map(c => c.voiceSettings?.voiceIndex)
      .filter(idx => idx !== undefined);
    
    // Check if all characters have the same voice
    const allHaveSameVoice = existingVoiceIndices.length > 1 && 
                           existingVoiceIndices.every(idx => idx === existingVoiceIndices[0]);
    
    console.log('🎲 Voice language check:', {
      scriptLang: scriptLanguage,
      voiceLanguageMatches: availableVoices.length > 0,
      needsShuffling: !allHaveSameVoice,
      allHaveSameVoice,
      existingVoiceIndices: existingVoiceIndices.map(idx => 
        idx !== undefined && idx >= 0 && idx < voices.length 
          ? `${voices[idx].name} (${voices[idx].lang})`
          : 'invalid index'
      )
    });
    
    // If all characters already have different voices, don't shuffle
    if (!allHaveSameVoice && availableVoices.length > 0) {
      console.log('🔄 Reassigning voices for', scriptLanguage, 'script');
      
      // Assign different voices to characters
      return characters.map((character, index) => {
        const selectedVoice = availableVoices[index % availableVoices.length];
        const globalVoiceIndex = voices.indexOf(selectedVoice);
        
        const newVoiceSettings = {
          rate: character.voiceSettings?.rate || 1.0,
          volume: character.voiceSettings?.volume || 1.0,
          voiceIndex: globalVoiceIndex >= 0 ? globalVoiceIndex : 0
        };

        console.log(`🎭 ${character.name} -> ${selectedVoice?.name || 'Default'} (${selectedVoice?.lang || 'unknown'})`);

        return {
          ...character,
          voiceSettings: newVoiceSettings
        };
      });
    }
    
    return characters;
  }, [voices]);

  // Memoized handlers to prevent recreation on every render
  const handleScriptLoaded = useCallback((
    loadedCharacters: Character[], 
    loadedLines: ScriptLine[], 
    title: string, 
    originalLanguage: string = 'en'
  ) => {
    console.log('📚 Script loaded:', {
      title,
      originalLanguage,
      charactersCount: loadedCharacters.length,
      linesCount: loadedLines.length
    });

    // ✅ CRITICAL FIX: Apply smart voice shuffling for proper language matching
    const charactersWithVoices = shuffleVoicesForCharacters(loadedCharacters, originalLanguage);

    setCharacters(charactersWithVoices);
    setLines(loadedLines);
    setScriptTitle(title);
    setScriptLanguage(originalLanguage);
    setCurrentState('character-selection');
    
    // Reset progress and starting line
    setUserProgress(null);
    setStartingLineIndex(0);
  }, [shuffleVoicesForCharacters]);

  const handleCharacterSelected = useCallback((character: string) => {
    setSelectedCharacter(character);
    
    // Load progress from localStorage and set it in the state ONCE before the session starts
    const progressKey = `${scriptTitle}-${character}`;
    const savedProgress = localStorage.getItem(progressKey);
    
    if (savedProgress) {
      try {
        const progress: UserProgress = JSON.parse(savedProgress);
        // Convert completedLines array back to array (keep as array, not Set)
        if (!Array.isArray(progress.completedLines)) {
          progress.completedLines = [];
        }
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to parse saved progress:', error);
        setUserProgress(null); // Reset if parsing fails
      }
    } else {
      setUserProgress(null); // No saved progress found
    }
  }, [scriptTitle]);

  const handleCharacterVoiceChange = useCallback(async (characterName: string, newVoiceSettings: VoiceSettings) => {
    console.log('🎵 Voice change for', characterName, ':', newVoiceSettings);
    
    // Update local state immediately for responsive UI
    setCharacters(prev => prev.map(char =>
      char.name === characterName
        ? { ...char, voiceSettings: newVoiceSettings }
        : char
    ));

    // Persist to database if character has an ID (from saved script)
    const character = characters.find(c => c.name === characterName);
    if (character?.id) {
      console.log('💾 Saving voice settings to database for character:', character.id);
      const result = await updateCharacterVoiceSettings(character.id, newVoiceSettings);
      if (result.error) {
        console.error('Failed to update voice settings:', result.error);
      } else {
        console.log('✅ Voice settings saved successfully');
      }
    } else {
      console.log('⚠️ Character has no database ID, voice settings saved locally only');
    }
  }, [characters, updateCharacterVoiceSettings]);

  // 🔥 NEW: Always show scene selector after character selection
  const handleStartPractice = useCallback(() => {
    console.log('🚀 App: handleStartPractice called - always showing scene selector');
    setShowStartingPointSelector(true);
  }, []);

  const handleStartingPointSelect = useCallback((actNumber: number, sceneNumber: number, lineIndex: number) => {
    console.log('🚀 App: Starting from Act', actNumber, 'Scene', sceneNumber, 'Line', lineIndex);
    setStartingLineIndex(lineIndex);
    setCurrentState('practice');
    setShowStartingPointSelector(false);
  }, []);

  // SIMPLIFIED: Save progress directly to localStorage WITHOUT updating state
  // This prevents the re-render loop that was causing the session to reset
  const handleProgressUpdate = useCallback((progress: UserProgress) => {
    console.log('📊 App: Progress update - saving to localStorage only');
    
    // Save progress directly to localStorage WITHOUT calling setUserProgress
    // This prevents the parent component from re-rendering during the session
    const progressKey = `${scriptTitle}-${selectedCharacter}`;
    try {
      // Convert Set to Array for JSON serialization
      const progressToSave = {
        ...progress,
        completedLines: Array.from(progress.completedLines)
      };
      localStorage.setItem(progressKey, JSON.stringify(progressToSave));
      console.log('📊 App: Progress saved to localStorage successfully');
      
      // Calculate average accuracy for this session and update performance tracking
      const scores = Object.values(progress.accuracyScores);
      const averageAccuracy = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      
      if (averageAccuracy > 0 && selectedCharacter) {
        // Update character performance tracking
        updateCharacterPerformance(scriptTitle, selectedCharacter, averageAccuracy);
        // Update script history (last selected character)
        updateScriptHistory(scriptTitle, selectedCharacter);
      }
    } catch (error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  }, [scriptTitle, selectedCharacter, updateCharacterPerformance, updateScriptHistory]);

  const handleBackToCharacterSelection = useCallback(() => {
    console.log('🔙 App: Back to character selection');
    setCurrentState('character-selection');
    setSelectedCharacter(null);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    console.log('🔙 App: Back to library');
    setCurrentState('library');
    setCharacters([]);
    setLines([]);
    setScriptTitle('');
    setScriptLanguage('en');
    setSelectedCharacter(null);
    setUserProgress(null);
    setStartingLineIndex(0);
  }, []);

  const handleMenuClick = useCallback(() => setShowSideMenu(true), []);
  const handleMenuClose = useCallback(() => setShowSideMenu(false), []);
  const handleSettingsClick = useCallback(() => setShowSettings(true), []);
  const handleSettingsClose = useCallback(() => setShowSettings(false), []);
  const handleStartingPointClose = useCallback(() => {
    setShowStartingPointSelector(false);
    // When closing scene selector, go back to character selection
    setCurrentState('character-selection');
  }, []);

  // Get speech recognition language code from script language (not UI language)
  const speechLanguage = scriptLanguageInfo.speechCode;

  // Stable props object to prevent unnecessary re-renders
  const practiceSessionProps = useMemo(() => ({
    lines,
    characters,
    selectedCharacter: selectedCharacter!,
    scriptTitle,
    scriptLanguage,
    accuracyLevel: settings.accuracyLevel,
    voiceSettings: settings.voiceSettings,
    language: speechLanguage,
    autoRecordTimeout: settings.autoRecordTimeout,
    startingLineIndex,
    practiceMode: settings.autoAdvance ? 'auto' : 'manual',
    onBack: handleBackToCharacterSelection,
    onProgressUpdate: handleProgressUpdate,
    // Speech synthesis props
    voices,
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
    isSpeechDetected // 🔥 ADD THIS - Pass speech detection state to PracticeSession
  }), [
    lines,
    characters,
    selectedCharacter,
    scriptTitle,
    scriptLanguage,
    settings.accuracyLevel,
    settings.voiceSettings,
    speechLanguage,
    settings.autoRecordTimeout,
    startingLineIndex,
    settings.autoAdvance,
    handleBackToCharacterSelection,
    handleProgressUpdate,
    voices,
    speak,
    stop,
    isSpeaking,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    speechRecognitionSupported,
    isSpeechDetected // 🔥 ADD THIS - Include in dependency array
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={handleMenuClick} />
      
      <main className="container mx-auto px-4 py-8">
        {currentState === 'library' && (
          <div className="space-y-8">
            <ScriptLibrary onScriptSelect={handleScriptLoaded} />
            
            <div className="text-center">
              <div className="inline-block bg-card rounded-lg p-1 shadow-sm border border-border">
                <button
                  onClick={() => setCurrentState('upload')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Upload New Script
                </button>
              </div>
            </div>
          </div>
        )}

        {currentState === 'upload' && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToLibrary}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
              >
                ← Back to Library
              </button>
            </div>
            <ScriptUpload onScriptLoaded={handleScriptLoaded} />
          </div>
        )}
        
        {currentState === 'character-selection' && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToLibrary}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
              >
                ← Back to Library
              </button>
            </div>
            <CharacterSelection
              characters={characters}
              scriptTitle={scriptTitle}
              scriptLanguage={scriptLanguage}
              selectedCharacter={selectedCharacter}
              onCharacterSelect={handleCharacterSelected}
              onCharacterVoiceChange={handleCharacterVoiceChange}
              onContinue={handleStartPractice}
              voices={voices}
              currentState={currentState}
            />
          </div>
        )}
        
        {currentState === 'practice' && selectedCharacter && (
          settings.useNewPracticeSession ? (
            <PracticeSessionNew
              lines={lines}
              characters={characters}
              selectedCharacter={selectedCharacter}
              scriptTitle={scriptTitle}
              accuracyLevel={settings.accuracyLevel}
              voiceSettings={settings.voiceSettings}
              language={scriptLanguage}
              autoRecordTimeout={settings.autoRecordTimeout}
              startingLineIndex={startingLineIndex}
              practiceMode={practiceMode}
              setPracticeMode={setPracticeMode}
              onSceneComplete={() => {
                handleBackToCharacterSelection();
              }}
              onGoToPreviousScene={() => {
                handleBackToCharacterSelection();
              }}
              onBack={handleBackToCharacterSelection}
              onProgressUpdate={handleProgressUpdate}
              speak={speak}
              stop={stop}
              isSpeaking={isSpeaking}
              isListening={isListening}
              transcript={transcript}
              startListening={startListening}
              stopListening={stopListening}
              resetTranscript={resetTranscript}
              speechRecognitionSupported={speechRecognitionSupported}
              isSpeechDetected={isSpeechDetected}
            />
          ) : (
            <PracticeSession
              lines={lines}
              characters={characters}
              selectedCharacter={selectedCharacter}
              scriptTitle={scriptTitle}
              accuracyLevel={settings.accuracyLevel}
              voiceSettings={settings.voiceSettings}
              language={scriptLanguage}
              autoRecordTimeout={settings.autoRecordTimeout}
              startingLineIndex={startingLineIndex}
              practiceMode={settings.autoAdvance ? 'auto' : 'manual'}
              onBack={handleBackToCharacterSelection}
              onProgressUpdate={handleProgressUpdate}
              speak={speak}
              stop={stop}
              isSpeaking={isSpeaking}
              isListening={isListening}
              transcript={transcript}
              startListening={startListening}
              stopListening={stopListening}
              resetTranscript={resetTranscript}
              speechRecognitionSupported={speechRecognitionSupported}
              isSpeechDetected={isSpeechDetected}
            />
          )
        )}
      </main>

      {/* Side Menu */}
      <SideMenu
        isOpen={showSideMenu}
        onClose={handleMenuClose}
        onSettingsClick={handleSettingsClick}
        onBackToLibrary={handleBackToLibrary}
        onExitSession={handleBackToCharacterSelection}
        currentView={currentState}
      />

      {/* Starting Point Selector Modal - Now Always Shown After Character Selection */}
      <StartingPointSelector
        isOpen={showStartingPointSelector}
        onClose={handleStartingPointClose}
        lines={lines}
        selectedCharacter={selectedCharacter || ''}
        lastProgress={userProgress}
        scriptTitle={scriptTitle}
        onStartingPointSelect={handleStartingPointSelect}
      />

      <Settings
        isOpen={showSettings}
        onClose={handleSettingsClose}
        accuracyLevel={settings.accuracyLevel}
        onAccuracyLevelChange={level => updateSettings({ accuracyLevel: level })}
        voiceSettings={settings.voiceSettings}
        onVoiceSettingsChange={vs => updateSettings({ voiceSettings: vs })}
        autoRecordTimeout={settings.autoRecordTimeout}
        onAutoRecordTimeoutChange={timeout => updateSettings({ autoRecordTimeout: timeout })}
        practiceMode={settings.autoAdvance ? 'auto' : 'manual'}
        onPracticeModeChange={mode => updateSettings({ autoAdvance: mode === 'auto' })}
        language={settings.language}
        useNewPracticeSession={settings.useNewPracticeSession}
        onUseNewPracticeSessionChange={use => updateSettings({ useNewPracticeSession: use })}
      />
    </div>
  );
}

export default App;