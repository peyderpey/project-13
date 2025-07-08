import { Character, ScriptLine } from '../types';
import { CharacterVoiceProfile, VoiceAnalysisResult } from '../types/tts';

export interface GeminiAnalysisRequest {
  scriptTitle: string;
  characters: Character[];
  lines: ScriptLine[];
  language: string;
}

export class GeminiVoiceAnalysisService {
  private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze script and characters to recommend optimal voices
   */
  async analyzeScriptForVoiceSelection(request: GeminiAnalysisRequest): Promise<VoiceAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await fetch(`${GeminiVoiceAnalysisService.API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;
      
      return this.parseAnalysisResult(analysisText, request.characters);
    } catch (error) {
      console.error('Error analyzing script for voice selection:', error);
      throw error;
    }
  }

  /**
   * Generate SSML with emotion and prosody for a specific line
   */
  async generateSSMLForLine(
    characterName: string,
    text: string,
    context: string,
    voiceProfile: CharacterVoiceProfile
  ): Promise<string> {
    try {
      const prompt = this.buildSSMLPrompt(characterName, text, context, voiceProfile);
      
      const response = await fetch(`${GeminiVoiceAnalysisService.API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini SSML generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Error generating SSML for line:', error);
      // Fallback to basic SSML
      return GoogleCloudTTSService.createSSML(text, {
        speakingRate: voiceProfile.voiceAttributes.speakingRate,
        pitch: voiceProfile.voiceAttributes.pitch,
        volume: voiceProfile.voiceAttributes.volumeGainDb,
      });
    }
  }

  private buildAnalysisPrompt(request: GeminiAnalysisRequest): string {
    const characterList = request.characters.map(char => 
      `- ${char.name}: ${char.lineCount} lines`
    ).join('\n');

    const sampleLines = request.lines.slice(0, 10).map(line => 
      `${line.character}: ${line.text}`
    ).join('\n');

    return `
You are an expert voice casting director and script analyst. Analyze the following script and provide voice recommendations for each character.

SCRIPT TITLE: ${request.scriptTitle}
LANGUAGE: ${request.language}

CHARACTERS:
${characterList}

SAMPLE DIALOGUE:
${sampleLines}

Please analyze each character and provide:
1. Personality traits and emotional range
2. Age and accent considerations
3. Recommended voice type and characteristics
4. Optimal voice attributes (speaking rate, pitch, volume)

Respond in the following JSON format:
{
  "characters": [
    {
      "characterName": "Character Name",
      "personality": "Brief personality description",
      "age": "Age range or description",
      "accent": "Accent or dialect if applicable",
      "emotion": "Primary emotional state",
      "voiceType": "Voice type description",
      "recommendedVoice": {
        "name": "Google TTS voice name",
        "languageCode": "en-US",
        "gender": "MALE/FEMALE/NEUTRAL",
        "description": "Why this voice fits"
      },
      "voiceAttributes": {
        "speakingRate": 1.0,
        "pitch": 0.0,
        "volumeGainDb": 0.0
      }
    }
  ],
  "overallMood": "Overall mood of the script",
  "genre": "Script genre",
  "recommendations": ["General voice casting recommendations"]
}

Focus on creating distinct, memorable voices that enhance the storytelling.
`;
  }

  private buildSSMLPrompt(
    characterName: string,
    text: string,
    context: string,
    voiceProfile: CharacterVoiceProfile
  ): string {
    return `
You are an expert in SSML (Speech Synthesis Markup Language) for Google Cloud Text-to-Speech.

Character: ${characterName}
Personality: ${voiceProfile.personality}
Voice Type: ${voiceProfile.voiceType}

Context: ${context}
Text to convert: "${text}"

Generate SSML that captures the character's personality and emotion. Use:
- <prosody> tags for rate, pitch, and volume
- <say-as> tags for emphasis
- <break> tags for pacing
- Emotion and character-appropriate delivery

Base SSML structure:
<speak>
  <prosody rate="${voiceProfile.voiceAttributes.speakingRate}" 
           pitch="${voiceProfile.voiceAttributes.pitch}st" 
           volume="${voiceProfile.voiceAttributes.volumeGainDb}dB">
    [Enhanced text with SSML tags]
  </prosody>
</speak>

Return only the SSML markup, no explanations.
`;
  }

  private parseAnalysisResult(analysisText: string, characters: Character[]): VoiceAnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and map to our types
      const characterProfiles: CharacterVoiceProfile[] = parsed.characters.map((char: any) => ({
        characterName: char.characterName,
        personality: char.personality || '',
        age: char.age || '',
        accent: char.accent || '',
        emotion: char.emotion || '',
        voiceType: char.voiceType || '',
        recommendedVoice: {
          name: char.recommendedVoice?.name || '',
          languageCode: char.recommendedVoice?.languageCode || 'en-US',
          gender: char.recommendedVoice?.gender || 'NEUTRAL',
          description: char.recommendedVoice?.description || ''
        },
        voiceAttributes: {
          speakingRate: char.voiceAttributes?.speakingRate || 1.0,
          pitch: char.voiceAttributes?.pitch || 0.0,
          volumeGainDb: char.voiceAttributes?.volumeGainDb || 0.0
        }
      }));

      return {
        characters: characterProfiles,
        overallMood: parsed.overallMood || '',
        genre: parsed.genre || '',
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      // Return fallback result
      return {
        characters: characters.map(char => ({
          characterName: char.name,
          personality: 'Default personality',
          age: 'Adult',
          accent: 'Standard',
          emotion: 'Neutral',
          voiceType: 'Standard',
          recommendedVoice: {
            name: 'en-US-Standard-A',
            languageCode: 'en-US',
            gender: 'FEMALE',
            description: 'Default voice'
          },
          voiceAttributes: {
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        })),
        overallMood: 'Neutral',
        genre: 'Drama',
        recommendations: ['Use default voice settings']
      };
    }
  }
}

// Import for fallback SSML generation
import { GoogleCloudTTSService } from './googleCloudTTS'; 