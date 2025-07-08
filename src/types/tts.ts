// Google Cloud Text-to-Speech Types
export interface VoiceSelectionParams {
  languageCode: string;
  name?: string;
  ssmlGender?: 'SSML_VOICE_GENDER_UNSPECIFIED' | 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface AudioConfig {
  audioEncoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW' | 'ALAW';
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
  effectsProfileId?: string[];
}

export interface SynthesisInput {
  text?: string;
  ssml?: string;
}

export interface TTSRequest {
  input: SynthesisInput;
  voice: VoiceSelectionParams;
  audioConfig: AudioConfig;
}

export interface TTSResponse {
  audioContent: string; // base64 encoded audio
}

// Gemini Voice Analysis Types
export interface CharacterVoiceProfile {
  characterName: string;
  personality: string;
  age: string;
  accent: string;
  emotion: string;
  voiceType: string;
  recommendedVoice: {
    name: string;
    languageCode: string;
    gender: string;
    description: string;
  };
  voiceAttributes: {
    speakingRate: number;
    pitch: number;
    volumeGainDb: number;
  };
}

export interface VoiceAnalysisResult {
  characters: CharacterVoiceProfile[];
  overallMood: string;
  genre: string;
  recommendations: string[];
}

// AI Voiceover Component Types
export interface VoiceoverLine {
  id: string;
  characterName: string;
  text: string;
  audioUrl?: string;
  voiceProfile: CharacterVoiceProfile;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
}

export interface VoiceoverSession {
  id: string;
  scriptId: string;
  title: string;
  lines: VoiceoverLine[];
  totalCost: number;
  status: 'setup' | 'generating' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

// Google Cloud Voice Types
export interface GoogleVoice {
  name: string;
  languageCodes: string[];
  ssmlGender: string;
  naturalSampleRateHertz: number;
}

export interface VoiceListResponse {
  voices: GoogleVoice[];
} 