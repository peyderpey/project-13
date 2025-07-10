import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Character, ScriptLine, VoiceSettings } from '../types';
import { convertPlayToSavedScript, convertLinesToScenes } from '../utils/scriptConverter';

// --- Interfaces & Types ---

export interface SavedScript {
  id: string;
  title: string;
  author?: string;
  language?: string;
  characters: Character[];
  lines: ScriptLine[];
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  tags: string[];
}

export type GeminiScriptResponse = {
  script: {
    title: string;
    author: string;
    language: string;
    summary: string;
    scenes: {
      scene_number: number;
      act_number: number;
      setting: string;
      lines: {
        line_number: number;
        character: string;
        dialogue: string;
        ssml: string;
      }[];
    }[];
  };
  characters: {
    name: string;
    analysis: {
      description: string;
      age_group: string;
      gender: string;
    };
    voice_profile: {
      google_voice_recommendation: string;
      gemini_tts_prompt: string;
      ssml_template: string;
    };
  }[];
};

// --- Main Hook ---
export const useScripts = () => {
  const [userScripts, setUserScripts] = useState<SavedScript[]>([]);
  const [demoScripts, setDemoScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchInProgressRef = useRef<string | null>(null);

  const fetchUserScripts = useCallback(async (userId?: string) => {
    if (!userId || fetchInProgressRef.current === userId) return;
    setLoading(true);
    setError(null);
    fetchInProgressRef.current = userId;
    try {
      const { data, error } = await supabase
        .from('plays')
        .select(`*, characters!fk_characters_play_id(*), scenes!fk_scenes_play_id(*)`)
        .eq('user_id', userId)
        .eq('is_public', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setUserScripts(data.map(convertPlayToSavedScript));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user scripts');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = null;
    }
  }, []);
  
  const fetchDemoScripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('plays')
        .select(`*, characters!fk_characters_play_id(*), scenes!fk_scenes_play_id(*)`)
        .eq('is_public', true)
        .order('title', { ascending: true });
      if (error) throw error;
      setDemoScripts(data.map(convertPlayToSavedScript));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch demo scripts');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveScript = useCallback(async (
    userId: string,
    title: string,
    content: string,
    characters: Character[],
    lines: ScriptLine[],
    fileType: string,
    fileSize: number,
    tags: string[] = [],
    author?: string,
    language?: string
  ): Promise<{ data: SavedScript | null; error: string | null }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: play, error: playError } = await supabase
        .from('plays')
        .insert({ user_id: userId, title, author, language, script_content: content, file_type: fileType, file_size: fileSize, tags })
        .select()
        .single();
      if (playError) throw new Error(`Play save failed: ${playError.message}`);

      if (characters.length > 0) {
        const charactersToInsert = characters.map(char => ({ play_id: play.play_id, character_name: char.name, line_count: char.lineCount }));
        await supabase.from('characters').insert(charactersToInsert);
      }
      
      const scenes = convertLinesToScenes(lines);
      if (scenes.length > 0) {
        const scenesToInsert = scenes.map(scene => ({ play_id: play.play_id, ...scene }));
        await supabase.from('scenes').insert(scenesToInsert);
      }

      await fetchUserScripts(userId);
      return { data: null, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save script';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchUserScripts]);

  const saveAiAssistedScript = useCallback(async (
    userId: string,
    geminiResponse: GeminiScriptResponse
  ): Promise<{ data: { play_id: string } | null; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const { data: newPlayId, error: rpcError } = await supabase.rpc('save_ai_assisted_script', {
        user_id_in: userId,
        gemini_response_in: geminiResponse,
      });

      if (rpcError) throw new Error(`Database transaction failed: ${rpcError.message}`);
      await fetchUserScripts(userId);
      return { data: { play_id: newPlayId as string }, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving the AI script.';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchUserScripts]);

  const updateCharacterVoiceSettings = async (characterId: string, voiceSettings: VoiceSettings) => {
    const { error } = await supabase.from('characters').update({ voice_settings: voiceSettings }).eq('character_id', characterId);
    if (error) return { error: `Voice settings update failed: ${error.message}` };
    setUserScripts(prev => prev.map(script => ({
        ...script,
        characters: script.characters.map(char => char.id === characterId ? { ...char, voiceSettings } : char)
    })));
    return { error: null };
  };

  const deleteScript = async (scriptId: string) => {
    const { error } = await supabase.from('plays').delete().eq('play_id', scriptId);
    if (error) return { error: `Delete failed: ${error.message}` };
    setUserScripts(prev => prev.filter(script => script.id !== scriptId));
    return { error: null };
  };
  
  return {
    userScripts,
    demoScripts,
    loading,
    error,
    fetchUserScripts,
    fetchDemoScripts,
    saveScript,
    saveAiAssistedScript,
    updateCharacterVoiceSettings,
    deleteScript
  };
};