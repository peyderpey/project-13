import { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ScriptLibrary } from './components/ScriptLibrary';
import { CharacterSelection } from './components/CharacterSelection';
import { PracticeSessionNew } from './components/PracticeSessionNew';
import { StartingPointSelector } from './components/StartingPointSelector';
import { Settings } from './components/Settings';
import { AIVoiceover } from './components/AIVoiceover';
import { Character, ScriptLine, VoiceSettings, getScriptLanguageInfo, UserProgress } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useScripts } from './hooks/useScripts';
import { useAppSettings } from './hooks/useAppSettings';

type AppState = 'library' | 'character-selection' | 'starting-point' | 'practice' | 'ai-voiceover';

function App() {
  const { updateCharacterVoiceSettings } = useScripts();
  const [currentState, setCurrentState] = useState<AppState>('library');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptLanguage, setScriptLanguage] = useState('en');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStartingPointSelector, setShowStartingPointSelector] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [startingLineIndex, setStartingLineIndex] = useState(0);
  const { settings, updateSettings, updateCharacterPerformance, updateScriptHistory } = useAppSettings();
  const [practiceMode, setPracticeMode] = useState<'auto' | 'manual'>(settings.autoAdvance ? 'auto' : 'manual');
  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem('practiceTemplate-default') || 'chat');
  
  const { voices, speak, stop, isSpeaking } = useSpeechSynthesis();
  
  const scriptLanguageInfo = useMemo(() => getScriptLanguageInfo(scriptLanguage), [scriptLanguage]);
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechRecognitionSupported,
    isSpeechDetected
  } = useSpeechRecognition(scriptLanguageInfo.speechCode);

  const shuffleVoicesForCharacters = useCallback((
    characters: Character[], 
    scriptLanguage: string
  ): Character[] => {
    const scriptLangInfo = getScriptLanguageInfo(scriptLanguage);
    
    const availableVoices = voices.filter(voice => {
      const langPrefix = scriptLangInfo.speechCode.split('-')[0].toLowerCase();
      const voiceLangPrefix = voice.lang.split('-')[0].toLowerCase();
      return voiceLangPrefix === langPrefix;
    });
    
    if (availableVoices.length === 0) {
      return characters.map(char => ({
        ...char,
        voiceSettings: {
          rate: settings.voiceSettings.rate,
          volume: settings.voiceSettings.volume,
          voiceIndex: 0
        }
      }));
    }

    const existingVoiceIndices = characters
      .map(c => c.voiceSettings?.voiceIndex)
      .filter(idx => idx !== undefined);
    
    const allHaveSameVoice = existingVoiceIndices.length > 1 && 
                           existingVoiceIndices.every(idx => idx === existingVoiceIndices[0]);
    
    if (!allHaveSameVoice && availableVoices.length > 0) {
      return characters.map((character, index) => {
        const selectedVoice = availableVoices[index % availableVoices.length];
        const globalVoiceIndex = voices.indexOf(selectedVoice);
        
        const newVoiceSettings = {
          rate: settings.voiceSettings.rate,
          volume: settings.voiceSettings.volume,
          voiceIndex: globalVoiceIndex >= 0 ? globalVoiceIndex : 0
        };

        return {
          ...character,
          voiceSettings: newVoiceSettings
        };
      });
    }
    
    return characters;
  }, [voices, settings.voiceSettings]);

  const handleScriptLoaded = useCallback((
    loadedCharacters: Character[], 
    loadedLines: ScriptLine[], 
    title: string, 
    originalLanguage: string = 'en'
  ) => {
    const charactersWithVoices = shuffleVoicesForCharacters(loadedCharacters, originalLanguage);

    setCharacters(charactersWithVoices);
    setLines(loadedLines);
    setScriptTitle(title);
    setScriptLanguage(originalLanguage);
    setCurrentState('character-selection');
    
    setUserProgress(null);
    setStartingLineIndex(0);
  }, [shuffleVoicesForCharacters]);

  const handleCharacterSelected = useCallback((character: string) => {
    setSelectedCharacter(character);
    
    const progressKey = `${scriptTitle}-${character}`;
    const savedProgress = localStorage.getItem(progressKey);
    
    if (savedProgress) {
      try {
        const progress: UserProgress = JSON.parse(savedProgress);
        if (!Array.isArray(progress.completedLines)) {
          progress.completedLines = [];
        }
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to parse saved progress:', error);
        setUserProgress(null);
      }
    } else {
      setUserProgress(null);
    }
  }, [scriptTitle]);

  const handleAIVoiceover = useCallback(() => {
    setCurrentState('ai-voiceover');
  }, []);

  const handleCharacterVoiceChange = useCallback(async (characterName: string, newVoiceSettings: VoiceSettings) => {
    setCharacters(prev => prev.map(char =>
      char.name === characterName
        ? { ...char, voiceSettings: newVoiceSettings }
        : char
    ));

    const character = characters.find(c => c.name === characterName);
    if (character?.id) {
      await updateCharacterVoiceSettings(character.id, newVoiceSettings);
    }
  }, [characters, updateCharacterVoiceSettings]);

  const handleStartPractice = useCallback(() => {
    setShowStartingPointSelector(true);
  }, []);

  const handleStartingPointSelect = useCallback((lineIndex: number) => {
    setStartingLineIndex(lineIndex);
    setCurrentState('practice');
    setShowStartingPointSelector(false);
  }, []);

  const handleProgressUpdate = useCallback((progress: UserProgress) => {
    const progressKey = `${scriptTitle}-${selectedCharacter}`;
    try {
      const progressToSave = {
        ...progress,
        completedLines: Array.from(progress.completedLines)
      };
      localStorage.setItem(progressKey, JSON.stringify(progressToSave));
      
      const scores = Object.values(progress.accuracyScores);
      const averageAccuracy = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      
      if (averageAccuracy > 0 && selectedCharacter) {
        updateCharacterPerformance(scriptTitle, selectedCharacter, averageAccuracy);
        updateScriptHistory(scriptTitle, selectedCharacter);
      }
    } catch (error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  }, [scriptTitle, selectedCharacter, updateCharacterPerformance, updateScriptHistory]);

  const handleBackToCharacterSelection = useCallback(() => {
    setCurrentState('character-selection');
    setSelectedCharacter(null);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setCurrentState('library');
    setCharacters([]);
    setLines([]);
    setScriptTitle('');
    setScriptLanguage('en');
    setSelectedCharacter(null);
    setUserProgress(null);
    setStartingLineIndex(0);
  }, []);

  const handleStartingPointClose = useCallback(() => {
    setShowStartingPointSelector(false);
    setCurrentState('character-selection');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        settings={settings}
        updateSettings={updateSettings}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentState === 'library' && (
          <ScriptLibrary onScriptSelect={handleScriptLoaded} />
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
              onAIVoiceover={handleAIVoiceover}
              voices={voices}
              currentState={currentState}
            />
          </div>
        )}
        
        {currentState === 'practice' && selectedCharacter && (
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
            template={selectedTemplate as 'chat' | 'classic' | 'large-print' | 'teleprompter' | 'theatre'}
            onSceneComplete={handleBackToCharacterSelection}
            onGoToPreviousScene={handleBackToCharacterSelection}
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
        )}

        {currentState === 'ai-voiceover' && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToLibrary}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
              >
                ← Back to Library
              </button>
            </div>
            <AIVoiceover 
              scriptId="current-script"
              scriptTitle={scriptTitle}
              characters={characters}
              lines={lines}
              scriptLanguage={scriptLanguage}
              onClose={handleBackToLibrary}
            />
          </div>
        )}
      </main>

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
        onClose={() => setShowSettings(false)}
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
        onPracticeTemplateChange={template => {
          setSelectedTemplate(template);
          localStorage.setItem('practiceTemplate-default', template);
        }}
      />
    </div>
  );
}

export default App;