import React, { useEffect } from 'react';
import { Users, Volume2, Sparkles, Crown } from 'lucide-react';
import { Character, VoiceSettings, getScriptLanguageInfo } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useAppSettings } from '../hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Label } from '@/components/ui/label';

interface CharacterSelectionProps {
  characters: Character[];
  scriptTitle: string;
  scriptLanguage: string;
  selectedCharacter: string | null;
  onCharacterSelect: (character: string) => void;
  onCharacterVoiceChange: (characterName: string, voiceSettings: VoiceSettings) => void;
  onContinue: () => void;
  onAIVoiceover?: () => void;
  voices: SpeechSynthesisVoice[];
  currentState: 'library' | 'upload' | 'character-selection' | 'starting-point' | 'practice';
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  characters,
  scriptTitle,
  scriptLanguage,
  selectedCharacter,
  onCharacterSelect,
  onCharacterVoiceChange,
  onContinue,
  onAIVoiceover,
  voices,
  currentState
}) => {
  const { t, tp } = useTranslation();
  const { scriptHistory, settings } = useAppSettings();
  const scriptLangInfo = getScriptLanguageInfo(scriptLanguage);

  // Sort characters with previous character first, then alphabetically
  const sortedCharacters = [...characters].sort((a, b) => {
    const previousCharacter = scriptHistory[scriptTitle]?.lastSelectedCharacter;
    
    // If this is the previously selected character, put it first
    if (a.name === previousCharacter) return -1;
    if (b.name === previousCharacter) return 1;
    
    // Otherwise sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // FIXED: Auto-advance when character is selected - but ONLY when in character-selection state
  useEffect(() => {
    // CRITICAL GUARD: This effect should only run if the app is in the character selection state
    // This prevents interference with the practice session when progress updates trigger re-renders
    if (selectedCharacter && currentState === 'character-selection') {
      console.log('🎭 CharacterSelection: Auto-advancing to practice for', selectedCharacter);
      
      // Small delay to allow user to see the selection, then auto-advance
      const timer = setTimeout(() => {
        onContinue();
      }, 1000);
      
      return () => {
        console.log('🎭 CharacterSelection: Clearing auto-advance timer');
        clearTimeout(timer);
      };
    } else if (selectedCharacter && currentState !== 'character-selection') {
      console.log('🎭 CharacterSelection: Not auto-advancing - app is in', currentState, 'state');
    }
  }, [selectedCharacter, onContinue, currentState]);

  // Filter voices by script language
  const scriptLanguageVoices = voices.filter(voice => {
    const langPrefix = scriptLangInfo.speechCode.split('-')[0].toLowerCase();
    const voiceLangPrefix = voice.lang.split('-')[0].toLowerCase();
    return voiceLangPrefix === langPrefix;
  });

  const handleVoiceChange = async (characterName: string, voiceIndex: number) => {
    const character = sortedCharacters.find(c => c.name === characterName);
    if (character && character.voiceSettings) {
      const newVoiceSettings = {
        ...character.voiceSettings,
        voiceIndex
      };
      await onCharacterVoiceChange(characterName, newVoiceSettings);
    }
  };

  const testVoice = (character: Character) => {
    if (character.voiceSettings && voices[character.voiceSettings.voiceIndex]) {
      const utterance = new SpeechSynthesisUtterance(`Hello, I am ${character.name}`);
      utterance.voice = voices[character.voiceSettings.voiceIndex];
      utterance.rate = settings.voiceSettings.rate;
      utterance.volume = settings.voiceSettings.volume;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCharacterSelect = async (characterName: string) => {
    console.log('🎭 CharacterSelection: Character selected:', characterName);
    onCharacterSelect(characterName);
    
    // Auto-save voice settings when character is selected
    const character = sortedCharacters.find(c => c.name === characterName);
    if (character && character.voiceSettings) {
      await onCharacterVoiceChange(characterName, character.voiceSettings);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('characterSelection.title')}</h2>
        <p className="text-muted-foreground mb-3 text-sm">
          {t('characterSelection.subtitle')} "{scriptTitle}"
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <span>{scriptLangInfo.flag}</span>
          <span>Script Language: {scriptLangInfo.nativeName}</span>
        </div>
        {selectedCharacter && currentState === 'character-selection' && (
          <Alert className="mt-3">
            <AlertDescription className="font-medium">
              Selected: {selectedCharacter} - Starting rehearsal...
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedCharacters.map((character) => (
          <Card
            key={character.name}
            className={`transition-all duration-200 hover:shadow-md group ${
              selectedCharacter === character.name
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'hover:border-border/50'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg transition-colors duration-200 ${
                  selectedCharacter === character.name
                    ? 'bg-primary/10'
                    : 'bg-muted group-hover:bg-muted/80'
                }`}>
                  <Users className={`w-4 h-4 ${
                    selectedCharacter === character.name ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                {selectedCharacter === character.name && (
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                )}
              </div>
              
              <CardTitle className="text-base">{character.name}</CardTitle>
              <CardDescription className="text-xs">
                {tp('characterSelection.linesCount', character.lineCount, 
                    `${character.lineCount} ${t('characterSelection.linesCount')}`,
                    `${character.lineCount} ${t('characterSelection.linesCount')}`
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Voice Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Character Voice
                </Label>
                <Select
                  value={String(character.voiceSettings?.voiceIndex || 0)}
                  onValueChange={(value) => handleVoiceChange(character.name, parseInt(value))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {scriptLanguageVoices.length > 0 ? (
                      scriptLanguageVoices.map((voice, index) => (
                        <SelectItem key={index} value={String(voices.indexOf(voice))}>
                          {voice.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0">Default Voice</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => testVoice(character)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  title="Test voice"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Test
                </Button>
                <Button
                  onClick={() => handleCharacterSelect(character.name)}
                  variant={selectedCharacter === character.name ? "default" : "secondary"}
                  size="sm"
                  className="flex-1 text-xs"
                >
                  {selectedCharacter === character.name && currentState === 'character-selection' ? 'Starting...' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Voiceover Section - Only for Premium Users */}
      {onAIVoiceover && (
        <div className="mt-8 p-6 border-2 border-dashed border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-900">AI Voiceover Generation</h3>
              <Crown className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-sm text-purple-700 max-w-md mx-auto">
              Generate professional AI voiceovers for all characters using Google Cloud TTS and Gemini AI analysis.
            </p>
            <Button
              onClick={onAIVoiceover}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Voiceover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};