import { supabase } from '../lib/supabase';
import { AIParsingResult, PlayAnalysis, CharacterAnalysis, VoiceDirection, SceneAnalysis } from '../utils/aiParsingService';

export interface StoredAIAnalysis {
  id: string;
  script_title: string;
  script_content_hash: string;
  user_id: string;
  play_analysis: PlayAnalysis;
  character_analyses: CharacterAnalysis[];
  voice_directions: VoiceDirection[];
  scene_analyses: SceneAnalysis[];
  themes: string[];
  genre: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export class AIAnalysisStorage {
  
  /**
   * Store comprehensive AI analysis in database
   */
  static async storeAnalysis(
    userId: string,
    scriptTitle: string,
    scriptContent: string,
    aiResult: AIParsingResult
  ): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      // Create a hash of the script content for deduplication
      const contentHash = await this.createContentHash(scriptContent);
      
      // Check if we already have analysis for this content
      const existingAnalysis = await this.findExistingAnalysis(contentHash);
      if (existingAnalysis) {
        console.log('✅ Found existing AI analysis for this content:', existingAnalysis.id);
        return { success: true, analysisId: existingAnalysis.id };
      }

      // Store new analysis
      const analysisData = {
        script_title: scriptTitle,
        script_content_hash: contentHash,
        user_id: userId,
        play_analysis: aiResult.analysis.playAnalysis,
        character_analyses: aiResult.analysis.characterAnalyses,
        voice_directions: aiResult.analysis.voiceDirections,
        scene_analyses: aiResult.analysis.sceneAnalyses,
        themes: aiResult.analysis.themes,
        genre: aiResult.analysis.genre,
        difficulty: aiResult.analysis.difficulty,
        estimated_duration: aiResult.analysis.estimatedDuration,
        confidence_score: aiResult.stats.confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_script_analyses')
        .insert([analysisData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to store AI analysis:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully stored AI analysis:', data.id);
      
      // Also create character voice profiles for easy lookup
      await this.storeCharacterVoiceProfiles(data.id, aiResult.analysis.voiceDirections);
      
      return { success: true, analysisId: data.id };
    } catch (error) {
      console.error('❌ Error storing AI analysis:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Find existing analysis by content hash to avoid duplicate processing
   */
  static async findExistingAnalysis(contentHash: string): Promise<StoredAIAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('ai_script_analyses')
        .select('*')
        .eq('script_content_hash', contentHash)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error finding existing analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding existing analysis:', error);
      return null;
    }
  }

  /**
   * Get analysis by script title for reuse
   */
  static async getAnalysisByTitle(scriptTitle: string): Promise<StoredAIAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('ai_script_analyses')
        .select('*')
        .ilike('script_title', `%${scriptTitle}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting analysis by title:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting analysis by title:', error);
      return null;
    }
  }

  /**
   * Store character voice profiles separately for easy TTS lookup
   */
  private static async storeCharacterVoiceProfiles(
    analysisId: string,
    voiceDirections: VoiceDirection[]
  ): Promise<void> {
    try {
      const voiceProfiles = voiceDirections.map(voice => ({
        analysis_id: analysisId,
        character_name: voice.characterName,
        voice_profile: voice.voiceProfile,
        google_cloud_voice: voice.googleCloudVoice,
        alternative_voices: voice.alternativeVoices,
        speaking_notes: voice.speakingNotes,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('character_voice_profiles')
        .insert(voiceProfiles);

      if (error) {
        console.error('❌ Failed to store character voice profiles:', error);
      } else {
        console.log('✅ Stored character voice profiles:', voiceProfiles.length);
      }
    } catch (error) {
      console.error('❌ Error storing character voice profiles:', error);
    }
  }

  /**
   * Get character voice profile for TTS
   */
  static async getCharacterVoiceProfile(
    scriptTitle: string,
    characterName: string
  ): Promise<VoiceDirection | null> {
    try {
      const { data, error } = await supabase
        .from('character_voice_profiles')
        .select(`
          *,
          ai_script_analyses!inner(script_title)
        `)
        .ilike('ai_script_analyses.script_title', `%${scriptTitle}%`)
        .ilike('character_name', characterName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting character voice profile:', error);
        return null;
      }

      if (!data) return null;

      return {
        characterName: data.character_name,
        voiceProfile: data.voice_profile,
        googleCloudVoice: data.google_cloud_voice,
        alternativeVoices: data.alternative_voices,
        speakingNotes: data.speaking_notes
      };
    } catch (error) {
      console.error('Error getting character voice profile:', error);
      return null;
    }
  }

  /**
   * Get all character analyses for a script
   */
  static async getCharacterAnalyses(scriptTitle: string): Promise<CharacterAnalysis[]> {
    try {
      const analysis = await this.getAnalysisByTitle(scriptTitle);
      return analysis?.character_analyses || [];
    } catch (error) {
      console.error('Error getting character analyses:', error);
      return [];
    }
  }

  /**
   * Get scene analyses for educational purposes
   */
  static async getSceneAnalyses(scriptTitle: string): Promise<SceneAnalysis[]> {
    try {
      const analysis = await this.getAnalysisByTitle(scriptTitle);
      return analysis?.scene_analyses || [];
    } catch (error) {
      console.error('Error getting scene analyses:', error);
      return [];
    }
  }

  /**
   * Search for similar scripts by themes or genre
   */
  static async findSimilarScripts(
    themes: string[],
    genre: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<StoredAIAnalysis[]> {
    try {
      let query = supabase
        .from('ai_script_analyses')
        .select('*')
        .eq('genre', genre)
        .order('created_at', { ascending: false });

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Error finding similar scripts:', error);
        return [];
      }

      // Filter by themes overlap
      return (data || []).filter((analysis: StoredAIAnalysis) => 
        analysis.themes.some((theme: string) => 
          themes.some((searchTheme: string) => 
            theme.toLowerCase().includes(searchTheme.toLowerCase())
          )
        )
      );
    } catch (error) {
      console.error('Error finding similar scripts:', error);
      return [];
    }
  }

  /**
   * Create a hash of script content for deduplication
   */
  private static async createContentHash(content: string): Promise<string> {
    // Simple hash function - in production, use a proper crypto hash
    const normalizedContent = content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    // Create a simple hash from the content
    let hash = 0;
    for (let i = 0; i < normalizedContent.length; i++) {
      const char = normalizedContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get usage statistics for cost analysis
   */
  static async getUsageStats(): Promise<{
    totalAnalyses: number;
    uniqueScripts: number;
    costSavings: number;
    topGenres: Array<{ genre: string; count: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_script_analyses')
        .select('genre, script_content_hash');

      if (error) {
        console.error('Error getting usage stats:', error);
        return { totalAnalyses: 0, uniqueScripts: 0, costSavings: 0, topGenres: [] };
      }

      const totalAnalyses = data.length;
      const uniqueHashes = new Set(data.map(item => item.script_content_hash));
      const uniqueScripts = uniqueHashes.size;
      const duplicateAnalyses = totalAnalyses - uniqueScripts;
      const costSavings = duplicateAnalyses * 3.50; // Assuming $3.50 per analysis

      // Count genres
      const genreCounts: { [key: string]: number } = {};
      data.forEach(item => {
        genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
      });

      const topGenres = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalAnalyses,
        uniqueScripts,
        costSavings,
        topGenres
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { totalAnalyses: 0, uniqueScripts: 0, costSavings: 0, topGenres: [] };
    }
  }
}

export default AIAnalysisStorage; 