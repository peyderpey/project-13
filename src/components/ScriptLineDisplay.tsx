import React, { useMemo } from 'react';
import { 
  Volume2, 
  MessageCircle,
  User,
  Mic,
  Clock,
  RotateCcw
} from 'lucide-react';
import { ScriptLine, VoiceSettings } from '../types';

type LineVisibility = 'full' | 'partial' | 'hidden';

interface ScriptLineDisplayProps {
  line: ScriptLine;
  isCurrentLine: boolean;
  isUserLine: boolean;
  selectedCharacter: string;
  lineVisibility: LineVisibility;
  isListening: boolean;
  isSpeechDetected: boolean;
  timeoutCountdown: number;
  waitingForSpeech: boolean;
  isSpeaking: boolean;
  isWaitingForUser: boolean;
  getCharacterVoiceSettings: (characterName: string) => VoiceSettings;
  speak: (text: string, settings: VoiceSettings, language?: string) => void;
  language: string; // TTS language code
  characterColors: { [key: string]: string };
  accuracyScores: { [key: number]: number };
  myLines: ScriptLine[];
  isAutoMode: boolean;
  handleRetryLine: () => void;
  t: (key: string) => string; // Translation function
  getPartialWords: (text: string, lineId: string) => number[]; // Add getPartialWords prop
  speechRecognitionSupported: boolean; // Add speechRecognitionSupported prop
}

export const ScriptLineDisplay: React.FC<ScriptLineDisplayProps> = ({
  line,
  isCurrentLine,
  isUserLine,
  selectedCharacter,
  lineVisibility,
  isListening,
  isSpeechDetected,
  timeoutCountdown,
  waitingForSpeech,
  isSpeaking,
  isWaitingForUser,
  getCharacterVoiceSettings,
  speak,
  language,
  characterColors,
  accuracyScores,
  myLines,
  isAutoMode,
  handleRetryLine,
  t,
  getPartialWords,
  speechRecognitionSupported,
}) => {

  const myLineIndex = useMemo(() =>
    isUserLine ? myLines.findIndex(l => l.id === line.id) : -1,
    [isUserLine, myLines, line.id]
  );

  const lineAccuracy = isUserLine ? accuracyScores[myLineIndex] : undefined;

  const renderLineText = (line: ScriptLine, isCurrentLine: boolean) => {
    if (line.character !== selectedCharacter) {
      return line.text;
    }

    if (!isCurrentLine || lineVisibility === 'full') {
      return line.text;
    }

    if (lineVisibility === 'hidden') {
      return `••• ${t('practice.yourLine')} •••`;
    }

    if (lineVisibility === 'partial') {
      const words = line.text.split(' ');
      const visibleIndices = getPartialWords(line.text, line.id);

      return words.map((word, index) =>
        visibleIndices.includes(index) ? word : '___'
      ).join(' ');
    }

    return line.text;
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 70) return '😊';
    if (accuracy >= 40) return '😐';
    return '😞';
  };


  return (
    <div
      className={`flex ${isUserLine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 ${
        isCurrentLine ? 'transition-all duration-500' : ''
      }`}
    >
      <div className={`max-w-[85%] ${isUserLine ? 'order-2' : 'order-1'}`}>
        {/* Character Name */}
        <div className={`text-xs text-gray-500 mb-1 ${isUserLine ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center space-x-1">
            {!isUserLine && <MessageCircle className="w-3 h-3" />}
            {isUserLine && <User className="w-3 h-3" />}
            <span>
              {line.character}
              {isUserLine && ` (${t('practice.you')})`}
            </span>
          </div>
        </div>

        {/* Message Bubble */}
        <div
          className={`relative px-3 py-2 rounded-2xl shadow-lg text-sm ${
            characterColors[line.character] + ' text-white'
          } ${isCurrentLine ? 'ring-2 ring-yellow-400 ring-opacity-75 shadow-xl' : ''}`}
        >
          {/* Message Text */}
          <p className="leading-relaxed">
            {renderLineText(line, isCurrentLine)}
          </p>

          {/* Current Line Indicators */}
          {isCurrentLine && (
            <div className="mt-2 space-y-1">
              {/* Recording Status */}
              {isWaitingForUser ? ( // Assuming isWaitingForUser is passed down or derived
                isListening ? (
                  <div className="flex items-center space-x-1 text-red-200">
                    <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                    <span>Recording...</span>
                    {/* Show speech detection status */}
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
               ) : speechRecognitionSupported && !isAutoMode && (
                 <div className="flex items-center space-x-1 text-yellow-200">
                   <Mic className="w-3 h-3" />
                   <span>Tap to start recording</span>
                 </div>
               )}
              {/* Show actor-friendly countdown - only if speech not detected */}
              {timeoutCountdown > 0 && !isSpeechDetected && isAutoMode && isUserLine && (
                <div className="flex items-center space-x-1 text-orange-200">
                  <Clock className="w-3 h-3" />
                  <span>{timeoutCountdown}s generous time</span>
                </div>
              )}
            </div>
          )}

          {/* TTS Status */}
          {!isUserLine && (
            waitingForSpeech ? (
              <div className="flex items-center space-x-1 text-xs text-blue-200">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                <span>
                  {isSpeaking ? 'Speaking...' : 'Starting...'}
                </span>
              </div>
            ) : (
               // Manual TTS Button for non-user lines
              <button
                onClick={() => {
                  // These states need to be managed in the parent or a shared hook
                  // setWaitingForSpeech(true);
                  // setSpeechStarted(false);
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

        {/* Accuracy Result */}
        {isUserLine && isCurrentLine && lineAccuracy !== undefined && (
          <div className="mt-2">
            <div className={`p-2 rounded-lg border text-sm ${
              lineAccuracy >= 70
                ? 'bg-green-50 border-green-200'
                : lineAccuracy >= 40
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getAccuracyIcon(lineAccuracy)}</span>
                  <span className="font-medium">{lineAccuracy}%</span>
                </div>
                {!isAutoMode && (
                  <button
                    onClick={handleRetryLine}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    title="Retry"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

