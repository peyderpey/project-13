import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSettings } from '../types';

// Function to filter out fantastic/effect voices
const isNormalVoice = (voice: SpeechSynthesisVoice): boolean => {
  const fantasyPatterns = [
    /superstar/i,
    /wobble/i,
    /whisper/i,
    /echo/i,
    /robot/i,
    /alien/i,
    /monster/i,
    /cartoon/i,
    /chipmunk/i,
    /deep/i,
    /funny/i,
    /scary/i,
    /silly/i,
    /novelty/i,
    /effect/i,
    /special/i,
    /distorted/i,
    /bells/i,
    /organ/i,
    /bad\s?quality/i,
    // Additional fantasy voices to filter out
    /xarvox/i,
    /trinoids/i,
    /jester/i,
    /good\s?news/i,
    /cellos/i,
    /bubbles/i,
    /boing/i,
    /bahh/i,
    /bad\s?news/i,
    /albert/i,
    /hypnotic/i
  ];
  
  const name = voice.name.toLowerCase();
  return !fantasyPatterns.some(pattern => pattern.test(name));
};

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Main useEffect runs only once on component mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        // Filter out fantastic/effect voices but keep emotional and age-related voices
        const normalVoices = availableVoices.filter(isNormalVoice);
        setVoices(normalVoices);
        
        console.log('Voice filtering results:', {
          total: availableVoices.length,
          filtered: normalVoices.length,
          removed: availableVoices.length - normalVoices.length,
          allVoices: availableVoices.map(v => ({
            name: v.name,
            lang: v.lang
          })),
          filteredOut: availableVoices
            .filter(v => !isNormalVoice(v))
            .map(v => v.name)
            .join(', ')
        });
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
      
      // Force load voices on some browsers
      if (speechSynthesis.getVoices().length === 0) {
        setTimeout(loadVoices, 100);
      }
    }

    // Cleanup on unmount
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, settings: VoiceSettings, language?: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any existing speech
    speechSynthesis.cancel();
    
    // Wait a bit for cancel to take effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;
      
      // Set the language for the utterance FIRST
      if (language) {
        utterance.lang = language;
        console.log('Setting TTS language to:', language);
      }
      
      // Find and set the appropriate voice
      if (voices.length > 0) {
        let preferredVoice = null;
        
        // First try to use the selected voice index if it's valid
        if (voices[settings.voiceIndex]) {
          const selectedVoice = voices[settings.voiceIndex];
          // Check if the selected voice matches the language
          if (language) {
            const langPrefix = language.split('-')[0].toLowerCase();
            const voiceLangPrefix = selectedVoice.lang.split('-')[0].toLowerCase();
            if (voiceLangPrefix === langPrefix) {
              preferredVoice = selectedVoice;
            }
          } else {
            preferredVoice = selectedVoice;
          }
        }
        
        // If no preferred voice found, search for one that matches the language
        if (!preferredVoice && language) {
          const langPrefix = language.split('-')[0].toLowerCase();
          preferredVoice = voices.find(voice => {
            const voiceLangPrefix = voice.lang.split('-')[0].toLowerCase();
            return voiceLangPrefix === langPrefix;
          });
        }
        
        // Fallback to first voice or selected voice
        utterance.voice = preferredVoice || voices[settings.voiceIndex] || voices[0];
        
        console.log('Selected voice:', utterance.voice?.name, 'Language:', utterance.voice?.lang);
      }
      
      utterance.rate = settings.rate;
      utterance.volume = settings.volume;
      
      // Rely solely on onstart and onend events for state management
      utterance.onstart = () => {
        console.log('TTS started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('TTS ended');
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        console.log('TTS error:', event.error);
        // Don't log "interrupted" errors as they are expected when canceling speech
        if (event.error === 'interrupted') {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          return;
        }
        
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };
      
      console.log('Starting TTS for:', text.substring(0, 50) + '...', 'Language:', language);
      speechSynthesis.speak(utterance);
    }, 50);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    console.log('Stopping TTS');
    speechSynthesis.cancel();
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  return {
    voices,
    isSupported,
    isSpeaking,
    speak,
    stop
  };
};