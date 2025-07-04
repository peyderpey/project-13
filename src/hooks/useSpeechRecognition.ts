import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export const useSpeechRecognition = (language: string = 'tr-TR') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const hasResultRef = useRef(false);
  const isStartingRef = useRef(false); // Track if we're in the process of starting

  // Create SpeechRecognition object only once when component mounts
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log(`🎤 Final transcript result: "${finalTranscript}"`);
          setTranscript(finalTranscript.trim());
          hasResultRef.current = true;
        }
      };

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started - continuous mode enabled for dramatic pauses');
        setIsListening(true);
        setIsSpeechDetected(false);
        isStartingRef.current = false; // Reset starting flag
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
        setIsSpeechDetected(false);
        isStartingRef.current = false; // Reset starting flag
      };

      recognition.onspeechstart = () => {
        console.log('🗣️ Speech detected - user started speaking');
        setIsSpeechDetected(true);
      };

      recognition.onspeechend = () => {
        console.log('🤐 Speech ended - user stopped speaking');
        setIsSpeechDetected(false);
      };

      recognition.onaudiostart = () => {
        console.log('🔊 Audio input detected');
      };

      recognition.onaudioend = () => {
        console.log('🔇 Audio input ended');
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') {
          console.debug('Speech recognition aborted (expected behavior)');
        } else if (event.error === 'not-allowed') {
          console.warn('Speech recognition not allowed - check microphone permissions');
        } else if (event.error === 'network') {
          console.warn('Speech recognition network error');
        } else {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
        setIsSpeechDetected(false);
        isStartingRef.current = false; // Reset starting flag on error
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Separate useEffect that listens for language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      console.log('Updated speech recognition language to:', language);
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isStartingRef.current) {
      console.log('�� Speech recognition already starting or not available');
      return;
    }
    
    if (isListening) {
      console.log('🎤 Speech recognition already listening');
      return;
    }
    
    console.log('🎤 Starting actor-friendly speech recognition (continuous mode with generous timeout)...');
    setTranscript('');
    setIsSpeechDetected(false);
    hasResultRef.current = false;
    isStartingRef.current = true; // Set starting flag
    
    try {
      // Always abort first to ensure clean state
      recognitionRef.current.abort();
      
      // Small delay to ensure abort completes
      setTimeout(() => {
        if (recognitionRef.current && isStartingRef.current) {
          recognitionRef.current.start();
        }
      }, 100);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      setIsSpeechDetected(false);
      isStartingRef.current = false;
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      console.log('🎤 Manually stopping speech recognition - preserving any captured speech');
      recognitionRef.current.abort();
      isStartingRef.current = false;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setIsSpeechDetected(false);
    hasResultRef.current = false;
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    isSpeechDetected,
    startListening,
    stopListening,
    resetTranscript
  };
};