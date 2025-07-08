import { 
  TTSRequest, 
  TTSResponse, 
  VoiceListResponse, 
  GoogleVoice,
  VoiceSelectionParams,
  AudioConfig,
  SynthesisInput
} from '../types/tts';

export class GoogleCloudTTSService {
  private static readonly API_BASE_URL = 'https://texttospeech.googleapis.com/v1';
  private static readonly DISCOVERY_URL = 'https://texttospeech.googleapis.com/$discovery/rest?version=v1beta1';
  
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get available voices from Google Cloud TTS
   */
  async getAvailableVoices(languageCode?: string): Promise<GoogleVoice[]> {
    try {
      const url = new URL(`${GoogleCloudTTSService.API_BASE_URL}/voices:synthesize`);
      if (languageCode) {
        url.searchParams.append('languageCode', languageCode);
      }
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data: VoiceListResponse = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching available voices:', error);
      throw error;
    }
  }

  /**
   * Synthesize text to speech
   */
  async synthesizeSpeech(
    text: string,
    voice: VoiceSelectionParams,
    audioConfig: AudioConfig
  ): Promise<ArrayBuffer> {
    try {
      const request: TTSRequest = {
        input: { text },
        voice,
        audioConfig
      };

      const url = new URL(`${GoogleCloudTTSService.API_BASE_URL}/text:synthesize`);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`TTS synthesis failed: ${response.statusText}`);
      }

      const data: TTSResponse = await response.json();
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  /**
   * Synthesize SSML text to speech
   */
  async synthesizeSSML(
    ssml: string,
    voice: VoiceSelectionParams,
    audioConfig: AudioConfig
  ): Promise<ArrayBuffer> {
    try {
      const request: TTSRequest = {
        input: { ssml },
        voice,
        audioConfig
      };

      const url = new URL(`${GoogleCloudTTSService.API_BASE_URL}/text:synthesize`);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`SSML synthesis failed: ${response.statusText}`);
      }

      const data: TTSResponse = await response.json();
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error('Error synthesizing SSML:', error);
      throw error;
    }
  }

  /**
   * Get default audio config for MP3
   */
  static getDefaultAudioConfig(): AudioConfig {
    return {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0,
    };
  }

  /**
   * Create SSML with prosody and emotion
   */
  static createSSML(text: string, options: {
    speakingRate?: number;
    pitch?: number;
    volume?: number;
    emotion?: string;
  } = {}): string {
    const { speakingRate = 1.0, pitch = 0.0, volume = 0.0, emotion = '' } = options;
    
    let ssml = `<speak>`;
    
    if (emotion) {
      ssml += `<prosody rate="${speakingRate}" pitch="${pitch}st" volume="${volume}dB">`;
      ssml += `<say-as interpret-as="characters">${emotion}</say-as> `;
    }
    
    ssml += `<prosody rate="${speakingRate}" pitch="${pitch}st" volume="${volume}dB">`;
    ssml += text;
    ssml += `</prosody>`;
    
    if (emotion) {
      ssml += `</prosody>`;
    }
    
    ssml += `</speak>`;
    
    return ssml;
  }
} 