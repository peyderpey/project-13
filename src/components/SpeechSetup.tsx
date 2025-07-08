import React, { useEffect, useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Button } from './ui/button';
import { useAppSettings } from '../hooks/useAppSettings';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogPortal, DialogOverlay } from './ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { SUPPORTED_LANGUAGES, Language } from '../i18n';

interface SpeechSetupProps {
  isDemoUser: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

const DialogContentNoClose = React.forwardRef(
  ({ className, children, ...props }: any, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg ' + (className || '')
        }
        {...props}
      >
        {children}
        {/* No close button here! */}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContentNoClose.displayName = 'DialogContentNoClose';

export const SpeechSetup: React.FC<SpeechSetupProps> = ({ isDemoUser, onContinue, onCancel }) => {
  const { settings, updateSettings } = useAppSettings();
  const deviceId = settings.deviceId;
  const { voices, isSupported: ttsSupported, speak, stop } = useSpeechSynthesis();
  const {
    isSupported: recognitionSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(settings.language);

  const [skipForever, setSkipForever] = useState(false);
  const [recognitionTested, setRecognitionTested] = useState(false);
  const [recognitionSuccess, setRecognitionSuccess] = useState(false);
  const [ttsTested, setTtsTested] = useState(false);
  const [ttsTestVoice, setTtsTestVoice] = useState<string | null>(null);

  // Store TTS voices in localStorage per device
  useEffect(() => {
    if (ttsSupported && voices.length > 0) {
      localStorage.setItem(`ttsVoices-${deviceId}`, JSON.stringify(voices.map(v => ({
        name: v.name,
        lang: v.lang,
        gender: (v as any).gender || '',
        localService: v.localService,
        default: v.default
      }))));
      // TODO: If authenticated, sync to server here
    }
  }, [ttsSupported, voices, deviceId]);

  // Store recognition test result in localStorage per device/session
  useEffect(() => {
    if (recognitionTested) {
      localStorage.setItem(`speechRecognitionTest-${deviceId}`, JSON.stringify({
        success: recognitionSuccess,
        transcript,
        testedAt: Date.now()
      }));
      // TODO: If authenticated, sync to server here
    }
  }, [recognitionTested, recognitionSuccess, transcript, deviceId]);

  // Start recognition on mount
  useEffect(() => {
    if (recognitionSupported) {
      startListening();
    }
    return () => {
      stopListening();
      resetTranscript();
    };
    // eslint-disable-next-line
  }, [recognitionSupported]);

  // Mark recognition as tested if transcript appears
  useEffect(() => {
    if (transcript && transcript.length > 0) {
      setRecognitionTested(true);
      setRecognitionSuccess(true);
    }
  }, [transcript]);

  // TTS test handler
  const handleTtsTest = (voiceName: string) => {
    setTtsTestVoice(voiceName);
    speak('This is a test of the selected voice.', { rate: 1, volume: 1, voiceIndex: voices.findIndex(v => v.name === voiceName) }, voices.find(v => v.name === voiceName)?.lang);
    setTtsTested(true);
  };

  // Add flag selector handler
  const handleLanguageChange = (lang: Language) => {
    if (lang !== settings.language) {
      updateSettings({ language: lang });
    }
  };

  // Continue logic
  const canContinue = recognitionSuccess || (skipForever && !isDemoUser);

  // Handle continue
  const handleContinue = () => {
    if (!isDemoUser && skipForever) {
      localStorage.setItem(`skipSpeechSetup-${deviceId}`, 'true');
    }
    onContinue();
  };

  return (
    <Dialog open={true}>
      <DialogContentNoClose className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Speech & Voice Setup</DialogTitle>
          <DialogDescription>
            To use rehearsal, you must have both text-to-speech (TTS) and voice recognition working. Please test both below. If you have trouble, check your browser permissions and try again.
          </DialogDescription>
        </DialogHeader>
        
        {/* Microphone Permission Explanation */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 dark:text-blue-400 text-sm">🎤</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Microphone Permission Required</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This app needs access to your microphone to record your voice during practice sessions. 
                When prompted, please click "Allow" to grant microphone permission. 
                This permission is only used for speech recognition and is not stored or shared.
              </p>
            </div>
          </div>
        </div>
        {/* TTS Voices */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Available Voices</h3>
          {ttsSupported ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {voices.map((voice, i) => (
                <div key={voice.name + voice.lang} className="flex items-center gap-2 border rounded p-2">
                  <span className="font-mono text-sm">{voice.name}</span>
                  <span className="text-xs text-muted-foreground">{voice.lang}</span>
                  {voice.default && <span className="text-xs text-primary">Default</span>}
                  <Button size="sm" variant="outline" onClick={() => handleTtsTest(voice.name)}>
                    Test
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-destructive">TTS not supported in this browser.</div>
          )}
        </div>
        {/* Language Selector - only SUPPORTED_LANGUAGES from i18n config are shown */}
        <div className="mb-6 flex flex-row gap-2 justify-center items-center">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={settings.language === lang.code ? 'default' : 'outline'}
              size="icon"
              aria-label={lang.name}
              onClick={() => handleLanguageChange(lang.code)}
              className={`text-2xl transition-all ${settings.language === lang.code ? 'ring-2 ring-primary' : ''}`}
            >
              <span role="img" aria-label={lang.name}>{lang.flag}</span>
            </Button>
          ))}
        </div>
        {/* Voice Recognition Test */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Voice Recognition Test</h3>
          {recognitionSupported ? (
            <div className="space-y-2">
              <div className="border rounded p-2 min-h-[2.5rem] bg-muted">
                {isListening ? (
                  <span className="text-xs text-muted-foreground">Listening... Say something!</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Click below to start listening.</span>
                )}
                <div className="mt-1 font-mono text-sm text-primary">{transcript}</div>
              </div>
              <Button size="sm" variant="outline" onClick={startListening} disabled={isListening}>
                {isListening ? 'Listening...' : 'Start Test'}
              </Button>
              {recognitionTested && recognitionSuccess && (
                <div className="text-success text-xs">Recognition working!</div>
              )}
              {recognitionTested && !recognitionSuccess && (
                <div className="text-destructive text-xs">Recognition failed. Please check your mic and permissions.</div>
              )}
            </div>
          ) : (
            <div className="text-destructive">Voice recognition not supported in this browser.</div>
          )}
        </div>
        {/* Skip forever checkbox (not for demo users) */}
        {!isDemoUser && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="skipForever"
              checked={skipForever}
              onChange={e => setSkipForever(e.target.checked)}
            />
            <label htmlFor="skipForever" className="text-sm">
              I have given microphone permission forever on this device. Don’t ask me again.
            </label>
          </div>
        )}
        <DialogFooter className="flex gap-4 justify-end mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {recognitionSupported && (
            <Button onClick={handleContinue} disabled={!canContinue}>
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContentNoClose>
    </Dialog>
  );
}; 