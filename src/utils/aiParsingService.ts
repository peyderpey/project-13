import { Character, ScriptLine } from '../types';

export interface AIParsingOptions {
  includeStageDirections?: boolean;
  strictMode?: boolean;
  verboseLogging?: boolean;
}

export interface AIParsingResult {
  characters: Character[];
  lines: ScriptLine[];
  stats: {
    stageDirections: number;
    skippedLines: number;
    confidence: number;
    parseMethod: string;
  };
  cost: number;
  analysis: {
    playAnalysis: PlayAnalysis;
    characterAnalyses: CharacterAnalysis[];
    voiceDirections: VoiceDirection[];
    sceneAnalyses: SceneAnalysis[];
    themes: string[];
    genre: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number; // in minutes
  };
}

export interface PlayAnalysis {
  title: string;
  author?: string;
  genre: string;
  period: string;
  setting: string;
  themes: string[];
  mood: string;
  style: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  keyScenes: string[];
  culturalContext: string;
  language: string;
  estimatedDuration: number;
}

export interface CharacterAnalysis {
  name: string;
  description: string;
  personality: string[];
  motivation: string;
  arc: string;
  relationships: { character: string; relationship: string }[];
  age: string;
  gender: string;
  socialClass: string;
  occupation?: string;
  keyTraits: string[];
  emotionalRange: string[];
  speakingStyle: string;
  accent?: string;
  voiceType: 'soprano' | 'alto' | 'tenor' | 'bass' | 'mezzo-soprano' | 'baritone' | 'speaking';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface VoiceDirection {
  characterName: string;
  voiceProfile: {
    gender: 'male' | 'female' | 'neutral';
    age: 'child' | 'young' | 'adult' | 'elderly';
    accent: string;
    tone: string;
    pace: 'slow' | 'normal' | 'fast';
    pitch: 'low' | 'medium' | 'high';
    volume: 'soft' | 'normal' | 'loud';
    emotion: string;
    style: string;
  };
  googleCloudVoice?: {
    languageCode: string;
    voiceName: string;
    ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  alternativeVoices: string[];
  speakingNotes: string[];
}

export interface SceneAnalysis {
  actNumber: number;
  sceneNumber: number;
  title: string;
  setting: string;
  mood: string;
  keyEvents: string[];
  characters: string[];
  themes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  practiceNotes: string[];
}

export class AIParsingService {
  private static readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private static readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  static async parseScript(
    content: string,
    title: string,
    options: AIParsingOptions = {}
  ): Promise<AIParsingResult> {
    if (!this.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildParsingPrompt(content, title, options);
    
    try {
      const response = await fetch(`${this.BASE_URL}?key=${this.GEMINI_API_KEY}`, {
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
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      return this.parseAIResponse(aiResponse, title);
    } catch (error) {
      console.error('AI parsing failed:', error);
      throw new Error('AI parsing service is temporarily unavailable');
    }
  }

  private static buildParsingPrompt(
    content: string,
    title: string,
    options: AIParsingOptions
  ): string {
    return `
You are an expert script analyzer and parser. Please perform a comprehensive analysis of the following script, extracting characters, dialogue, and providing detailed analysis for future use.

Script Title: ${title}
Include Stage Directions: ${options.includeStageDirections ? 'Yes' : 'No'}
Strict Mode: ${options.strictMode ? 'Yes' : 'No'}

Script Content:
${content}

Please return a comprehensive JSON response with the following structure:
{
  "characters": [
    {
      "id": "character-1",
      "name": "CHARACTER_NAME",
      "lineCount": 0,
      "description": "Brief character description"
    }
  ],
  "lines": [
    {
      "id": "line-1",
      "character": "CHARACTER_NAME",
      "text": "The dialogue text",
      "lineNumber": 1,
      "actNumber": 1,
      "sceneNumber": 1,
      "actTitle": "ACT I",
      "sceneTitle": "SCENE I"
    }
  ],
  "stats": {
    "stageDirections": 0,
    "skippedLines": 0,
    "confidence": 0.95,
    "parseMethod": "AI-assisted"
  },
  "analysis": {
    "playAnalysis": {
      "title": "${title}",
      "author": "Author name if identifiable",
      "genre": "Drama/Comedy/Tragedy/etc",
      "period": "Historical period",
      "setting": "Where and when the play takes place",
      "themes": ["theme1", "theme2"],
      "mood": "Overall mood/tone",
      "style": "Writing style",
      "difficulty": "beginner/intermediate/advanced",
      "summary": "Brief plot summary",
      "keyScenes": ["Important scene descriptions"],
      "culturalContext": "Historical/cultural background",
      "language": "Language and dialect notes",
      "estimatedDuration": 120
    },
    "characterAnalyses": [
      {
        "name": "CHARACTER_NAME",
        "description": "Physical and personality description",
        "personality": ["trait1", "trait2"],
        "motivation": "What drives this character",
        "arc": "Character development throughout play",
        "relationships": [{"character": "OTHER_CHAR", "relationship": "friend/enemy/etc"}],
        "age": "young/middle-aged/elderly",
        "gender": "male/female/non-binary",
        "socialClass": "upper/middle/lower",
        "occupation": "Job or role if mentioned",
        "keyTraits": ["dominant traits"],
        "emotionalRange": ["emotions they express"],
        "speakingStyle": "How they speak",
        "accent": "Regional accent if any",
        "voiceType": "soprano/alto/tenor/bass/etc",
        "difficulty": "beginner/intermediate/advanced"
      }
    ],
    "voiceDirections": [
      {
        "characterName": "CHARACTER_NAME",
        "voiceProfile": {
          "gender": "male/female/neutral",
          "age": "child/young/adult/elderly",
          "accent": "British/American/Southern/etc",
          "tone": "warm/cold/authoritative/etc",
          "pace": "slow/normal/fast",
          "pitch": "low/medium/high",
          "volume": "soft/normal/loud",
          "emotion": "default emotional state",
          "style": "formal/casual/poetic/etc"
        },
        "googleCloudVoice": {
          "languageCode": "en-US",
          "voiceName": "en-US-Journey-D",
          "ssmlGender": "MALE/FEMALE/NEUTRAL"
        },
        "alternativeVoices": ["backup voice options"],
        "speakingNotes": ["Special pronunciation or delivery notes"]
      }
    ],
    "sceneAnalyses": [
      {
        "actNumber": 1,
        "sceneNumber": 1,
        "title": "Scene title or description",
        "setting": "Location and time",
        "mood": "Emotional tone of scene",
        "keyEvents": ["Important plot points"],
        "characters": ["Characters in this scene"],
        "themes": ["Themes explored"],
        "difficulty": "beginner/intermediate/advanced",
        "practiceNotes": ["Tips for actors/students"]
      }
    ],
    "themes": ["Major themes of the work"],
    "genre": "Primary genre",
    "difficulty": "beginner/intermediate/advanced",
    "estimatedDuration": 120
  }
}

ANALYSIS REQUIREMENTS:
1. Parse the script accurately for characters and dialogue
2. Provide comprehensive character analysis including voice directions for TTS
3. Analyze each scene for educational and practice purposes
4. Identify themes, mood, and difficulty level
5. Suggest appropriate Google Cloud TTS voices for each character
6. Provide cultural and historical context
7. Give practical notes for actors and students
8. Estimate performance duration in minutes
9. Assess difficulty level for different skill levels

Please analyze thoroughly as this data will be stored for future educational use.
`;
  }

  private static parseAIResponse(aiResponse: string, title: string): AIParsingResult {
    try {
      // Extract JSON from AI response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      const characters: Character[] = (parsed.characters || []).map((char: any, index: number) => ({
        id: char.id || `character-${index + 1}`,
        name: char.name || `CHARACTER_${index + 1}`,
        lineCount: char.lineCount || 0,
        description: char.description || ''
      }));

      const lines: ScriptLine[] = (parsed.lines || []).map((line: any, index: number) => ({
        id: line.id || `line-${index + 1}`,
        character: line.character || 'UNKNOWN',
        text: line.text || '',
        lineNumber: line.lineNumber || index + 1,
        actNumber: line.actNumber || 1,
        sceneNumber: line.sceneNumber || 1,
        actTitle: line.actTitle || 'ACT I',
        sceneTitle: line.sceneTitle || 'SCENE I'
      }));

      // Update character line counts
      const characterLineCounts: { [key: string]: number } = {};
      lines.forEach(line => {
        characterLineCounts[line.character] = (characterLineCounts[line.character] || 0) + 1;
      });

      characters.forEach(char => {
        char.lineCount = characterLineCounts[char.name] || 0;
      });

      const stats = {
        stageDirections: parsed.stats?.stageDirections || 0,
        skippedLines: parsed.stats?.skippedLines || 0,
        confidence: parsed.stats?.confidence || 0.8,
        parseMethod: 'AI-assisted'
      };

      // Calculate cost based on content length (rough estimation)
      const cost = Math.max(0.05, Math.min(0.50, (parsed.lines?.length || 0) * 0.01));

      // Extract analysis data with defaults
      const analysis = {
        playAnalysis: parsed.analysis?.playAnalysis || {
          title: title,
          author: 'Unknown',
          genre: 'Drama',
          period: 'Unknown',
          setting: 'Unknown',
          themes: ['Unknown'],
          mood: 'Unknown',
          style: 'Unknown',
          difficulty: 'intermediate' as const,
          summary: 'No summary available',
          keyScenes: [],
          culturalContext: 'Unknown',
          language: 'English',
          estimatedDuration: 90
        },
        characterAnalyses: parsed.analysis?.characterAnalyses || characters.map(char => ({
          name: char.name,
          description: 'No description available',
          personality: ['Unknown'],
          motivation: 'Unknown',
          arc: 'Unknown',
          relationships: [],
          age: 'adult',
          gender: 'unknown',
          socialClass: 'unknown',
          occupation: 'Unknown',
          keyTraits: ['Unknown'],
          emotionalRange: ['neutral'],
          speakingStyle: 'formal',
          accent: 'neutral',
          voiceType: 'speaking' as const,
          difficulty: 'intermediate' as const
        })),
        voiceDirections: parsed.analysis?.voiceDirections || characters.map(char => ({
          characterName: char.name,
          voiceProfile: {
            gender: 'neutral' as const,
            age: 'adult' as const,
            accent: 'neutral',
            tone: 'neutral',
            pace: 'normal' as const,
            pitch: 'medium' as const,
            volume: 'normal' as const,
            emotion: 'neutral',
            style: 'formal'
          },
          googleCloudVoice: {
            languageCode: 'en-US',
            voiceName: 'en-US-Journey-D',
            ssmlGender: 'NEUTRAL' as const
          },
          alternativeVoices: [],
          speakingNotes: []
        })),
        sceneAnalyses: parsed.analysis?.sceneAnalyses || [],
        themes: parsed.analysis?.themes || ['Unknown'],
        genre: parsed.analysis?.genre || 'Drama',
        difficulty: parsed.analysis?.difficulty || 'intermediate' as const,
        estimatedDuration: parsed.analysis?.estimatedDuration || 90
      };

      return {
        characters,
        lines,
        stats,
        cost,
        analysis
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to process AI parsing results');
    }
  }

  static async isAvailable(): Promise<boolean> {
    return !!this.GEMINI_API_KEY;
  }

  static estimateCost(content: string): number {
    // Rough cost estimation based on content length
    return Math.max(0.05, Math.min(0.50, content.length / 10000 * 0.10));
  }
}

export default AIParsingService; 