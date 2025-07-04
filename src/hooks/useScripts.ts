import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Character, ScriptLine, VoiceSettings } from '../types';

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

export interface DemoScript {
  id: string;
  title: string;
  description: string;
  characters: Character[];
  lines: ScriptLine[];
  tags: string[];
  language: string;
}

// Demo scripts for different languages
const DEMO_SCRIPTS: DemoScript[] = [
  // English Script 1 - Pygmalion by Bernard Shaw
  {
    id: 'demo-pygmalion',
    title: 'Pygmalion',
    description: 'Bernard Shaw\'s classic play about phonetics professor Henry Higgins and flower girl Eliza Doolittle',
    language: 'en',
    tags: ['Classic', 'Drama', 'Comedy', 'English'],
    characters: [
      { name: 'HIGGINS', lineCount: 0 },
      { name: 'PICKERING', lineCount: 0 },
      { name: 'ELIZA', lineCount: 0 },
      { name: 'MRS. PEARCE', lineCount: 0 },
      { name: 'DOOLITTLE', lineCount: 0 }
    ],
    lines: [
      {
        id: 'pygmalion-1',
        character: 'ELIZA',
        text: 'I ain\'t got no parents. They told me I was big enough to earn my own living and turned me out.',
        lineNumber: 1,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-2',
        character: 'MRS. PEARCE',
        text: 'Where\'s your mother?',
        lineNumber: 2,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-3',
        character: 'ELIZA',
        text: 'I ain\'t got no mother. Her that turned me out was my sixth stepmother. But I done without them. And I\'m a good girl, I am.',
        lineNumber: 3,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-4',
        character: 'HIGGINS',
        text: 'Well, the matter is, sir, that you have a girl in your bathroom, and that I want her to be left there. Mrs. Pearce knows all about her.',
        lineNumber: 4,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-5',
        character: 'PICKERING',
        text: 'In your bathroom! Why on earth—',
        lineNumber: 5,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-6',
        character: 'HIGGINS',
        text: 'Oh, it\'s the girl I told you about yesterday—the flower girl. She came here this morning, and I\'ve taken her on as a phonetic job. We\'re going to make a duchess of her.',
        lineNumber: 6,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-7',
        character: 'DOOLITTLE',
        text: 'Good morning, Governor. I come about a very serious matter, Governor.',
        lineNumber: 7,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-8',
        character: 'HIGGINS',
        text: 'Brought up in Hounslow. Mother Welsh, I should think.',
        lineNumber: 8,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-9',
        character: 'HIGGINS',
        text: 'What do you want, Doolittle?',
        lineNumber: 9,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-10',
        character: 'DOOLITTLE',
        text: 'I want my daughter: that\'s what I want. See?',
        lineNumber: 10,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-11',
        character: 'HIGGINS',
        text: 'Of course you do. You\'re her father, aren\'t you? You don\'t suppose anyone else wants her, do you? I\'m glad to see you have some spark of family feeling left.',
        lineNumber: 11,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-12',
        character: 'DOOLITTLE',
        text: 'Now, now, look here, Governor. Is this reasonable? Is it fair to take advantage of a man like this? The girl belongs to me. You got her. Where do I come in?',
        lineNumber: 12,
        actNumber: 2,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-13',
        character: 'HIGGINS',
        text: 'I\'ll teach her to speak properly, and in three months I\'ll pass her off as a duchess at an ambassador\'s garden party.',
        lineNumber: 13,
        actNumber: 3,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-14',
        character: 'ELIZA',
        text: 'I\'m a good girl, I am; and I won\'t pick up no free and easy ways.',
        lineNumber: 14,
        actNumber: 3,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-15',
        character: 'HIGGINS',
        text: 'If I decide to teach you, I\'ll be worse than two fathers to you.',
        lineNumber: 15,
        actNumber: 3,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-16',
        character: 'PICKERING',
        text: 'Does it occur to you, Higgins, that the girl has some feelings?',
        lineNumber: 16,
        actNumber: 3,
        sceneNumber: 1
      },
      {
        id: 'pygmalion-17',
        character: 'MRS. PEARCE',
        text: 'Will you please keep to the point, Mr. Higgins? I want to know on what terms the girl is to be here.',
        lineNumber: 17,
        actNumber: 3,
        sceneNumber: 1
      }
    ]
  },
  
  // English Script 2 - Salome by Oscar Wilde
  {
    id: 'demo-salome',
    title: 'Salomé',
    description: 'Oscar Wilde\'s poetic tragedy of obsession, revenge and death',
    language: 'en',
    tags: ['Tragedy', 'English', 'Classic', 'Biblical'],
    characters: [
      { name: 'SALOMÉ', lineCount: 0 },
      { name: 'HEROD', lineCount: 0 },
      { name: 'HERODIAS', lineCount: 0 },
      { name: 'JOKANAAN', lineCount: 0 },
      { name: 'THE YOUNG SYRIAN', lineCount: 0 },
      { name: 'THE PAGE OF HERODIAS', lineCount: 0 }
    ],
    lines: [
      {
        id: 'salome-1',
        character: 'THE YOUNG SYRIAN',
        text: 'How beautiful is the Princess Salomé to-night!',
        lineNumber: 1,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-2',
        character: 'THE PAGE OF HERODIAS',
        text: 'Look at the moon! How strange the moon seems! She is like a woman rising from a tomb. She is like a dead woman. You would fancy she was looking for dead things.',
        lineNumber: 2,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-3',
        character: 'SALOMÉ',
        text: 'I will not stay. I cannot stay. Why does the Tetrarch look at me all the while with his mole\'s eyes under his shaking eyelids? It is strange that the husband of my mother looks at me like that. I know not what it means. In truth, yes, I know it.',
        lineNumber: 3,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-4',
        character: 'JOKANAAN',
        text: 'After me shall come another mightier than I. I am not worthy so much as to unloose the latchet of his shoes. When he cometh, the solitary places shall be glad. They shall blossom like the lily.',
        lineNumber: 4,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-5',
        character: 'SALOMÉ',
        text: 'How black it is, down there! It must be terrible to be in so black a pit! It is like a tomb.',
        lineNumber: 5,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-6',
        character: 'JOKANAAN',
        text: 'Where is he whose cup of abominations is now full? Where is he, who in a robe of silver shall one day die in the face of all the people?',
        lineNumber: 6,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-7',
        character: 'SALOMÉ',
        text: 'Jokanaan, I am amorous of thy body! Thy body is white like the lilies of a field that the mower hath never mowed. Thy body is white like the snows that lie on the mountains, like the snows that lie on the mountains of Judæa, and come down into the valleys.',
        lineNumber: 7,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-8',
        character: 'JOKANAAN',
        text: 'Back! daughter of Babylon! By woman came evil into the world. Speak not to me. I will not listen to thee.',
        lineNumber: 8,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-9',
        character: 'SALOMÉ',
        text: 'I will kiss thy mouth, Jokanaan. I will kiss thy mouth.',
        lineNumber: 9,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-10',
        character: 'HEROD',
        text: 'Dance for me, Salomé. I pray thee dance for me. If thou dancest for me thou mayest ask of me what thou wilt, and I will give it thee, even unto the half of my kingdom.',
        lineNumber: 10,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-11',
        character: 'SALOMÉ',
        text: 'I would that they presently bring me in a silver charger the head of Jokanaan.',
        lineNumber: 11,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-12',
        character: 'HEROD',
        text: 'No, no, Salomé. You do not ask me that. Do not listen to your mother\'s voice. She is ever giving you evil counsel. Do not heed her.',
        lineNumber: 12,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-13',
        character: 'HERODIAS',
        text: 'My daughter has done well to ask the head of Jokanaan. He has covered me with insults. He has said monstrous things against me.',
        lineNumber: 13,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-14',
        character: 'SALOMÉ',
        text: 'Ah! thou wouldst not suffer me to kiss thy mouth, Jokanaan. Well! I will kiss it now. I will bite it with my teeth as one bites a ripe fruit.',
        lineNumber: 14,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'salome-15',
        character: 'HEROD',
        text: 'She is monstrous, thy daughter, she is altogether monstrous. In truth, what she has done is a great crime.',
        lineNumber: 15,
        actNumber: 1,
        sceneNumber: 1
      }
    ]
  },
  
  // Turkish Script - İstanbul Senden Daha Güzel
  {
    id: 'demo-istanbul',
    title: 'İstanbul Senden Daha Güzel',
    description: '12 Punto tiyatrosunun Murat Mah tarafından yazılmış oyunu',
    language: 'tr',
    tags: ['Modern', 'Drama', 'Türkçe', 'Komedi'],
    characters: [
      { name: 'AYŞE', lineCount: 0 },
      { name: 'MEHMET', lineCount: 0 },
      { name: 'ALİ', lineCount: 0 },
      { name: 'ZELİHA', lineCount: 0 },
      { name: 'KEMAL', lineCount: 0 }
    ],
    lines: [
      {
        id: 'istanbul-1',
        character: 'AYŞE',
        text: 'İstanbul, şu kalabalık şehir! Sanki herkesin bir hikayesi var.',
        lineNumber: 1,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-2',
        character: 'MEHMET',
        text: 'Hikayeler bitmeyen bir şehir. Her köşe başında farklı bir hayat...',
        lineNumber: 2,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-3',
        character: 'AYŞE',
        text: 'Bazen kendimi kaybolmuş hissediyorum bu kalabalıkta.',
        lineNumber: 3,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-4',
        character: 'ALİ',
        text: 'İstanbul senden daha güzel değil, sen bu şehrin en güzel parçasısın!',
        lineNumber: 4,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-5',
        character: 'AYŞE',
        text: 'Ne demek istiyorsun, Ali?',
        lineNumber: 5,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-6',
        character: 'ZELİHA',
        text: 'Hepimiz İstanbul\'un hikayesinin bir parçasıyız. Asırlardır süren bir hikayenin.',
        lineNumber: 6,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-7',
        character: 'KEMAL',
        text: 'Boğazın suları gibi akıyor hayat, durmak bilmiyor.',
        lineNumber: 7,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-8',
        character: 'MEHMET',
        text: 'Dostlar, hayatın tadını çıkaralım. Yarın ne olacağını kim bilebilir?',
        lineNumber: 8,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-9',
        character: 'AYŞE',
        text: 'İstanbul\'da yaşamak bir ayrıcalık, ama aynı zamanda bir mücadele.',
        lineNumber: 9,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-10',
        character: 'ZELİHA',
        text: 'Her gün yeni bir umutla uyanıyorum ben.',
        lineNumber: 10,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-11',
        character: 'ALİ',
        text: 'Ben de her gün seni görmek umuduyla uyanıyorum, Ayşe.',
        lineNumber: 11,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-12',
        character: 'KEMAL',
        text: 'Romantizmin şimdi sırası değil, işlerimize odaklanalım.',
        lineNumber: 12,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-13',
        character: 'MEHMET',
        text: 'Hayat sadece işten ibaret değil Kemal, biraz da kalbe yer açmalı.',
        lineNumber: 13,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-14',
        character: 'AYŞE',
        text: 'İstanbul\'da aşk başkadır... Martılar, vapurlar, çay bahçeleri...',
        lineNumber: 14,
        actNumber: 1,
        sceneNumber: 1
      },
      {
        id: 'istanbul-15',
        character: 'ZELİHA',
        text: 'Ve insan kalabalığı içinde o bir kişiyi bulmak, işte asıl mesele budur!',
        lineNumber: 15,
        actNumber: 1,
        sceneNumber: 1
      }
    ]
  }
];

export const useScripts = () => {
  const [userScripts, setUserScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track in-progress fetch to prevent race conditions
  const fetchInProgressRef = useRef<string | null>(null);

  const fetchUserScripts = useCallback(async (userId?: string) => {
    if (!userId) {
      console.log('useScripts: No user ID provided, clearing scripts');
      setUserScripts([]);
      return;
    }

    // Prevent multiple simultaneous fetches for the same user
    if (fetchInProgressRef.current === userId) {
      console.log('useScripts: Fetch already in progress for user:', userId);
      return;
    }

    try {
      fetchInProgressRef.current = userId;
      setLoading(true);
      setError(null);

      console.log('useScripts: Fetching plays for user:', userId);

      // Fetch plays with characters and scenes - using CORRECTED 'gender' column name
      const { data: plays, error: playsError } = await supabase
        .from('plays')
        .select(`
          *,
          characters!fk_characters_play_id (
            character_id,
            character_name,
            gender,
            age_group,
            line_count,
            voice_settings
          ),
          scenes!fk_scenes_play_id (
            scene_id,
            scene_number,
            scene_content,
            setting,
            act_number
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (playsError) {
        console.error('useScripts: Supabase error:', playsError);
        throw new Error(`Database error: ${playsError.message}`);
      }

      console.log('useScripts: Successfully fetched plays:', plays?.length || 0);

      // Debug: Log the raw data structure
      if (plays && plays.length > 0) {
        console.log('🔍 Raw play data sample:', {
          playTitle: plays[0].title,
          charactersCount: plays[0].characters?.length || 0,
          scenesCount: plays[0].scenes?.length || 0,
          firstCharacter: plays[0].characters?.[0],
          firstScene: plays[0].scenes?.[0]
        });
      }

      // Convert plays to SavedScript format
      const convertedScripts: SavedScript[] = (plays || []).map(play => {
        console.log(`🔄 Converting play: ${play.title}`);
        
        const characters = (play.characters || []).map(char => ({
          id: char.character_id,
          name: char.character_name,
          lineCount: char.line_count || 0,
          voiceSettings: char.voice_settings || {
            rate: 1.0,
            volume: 1.0,
            voiceIndex: 0
          }
        }));

        const lines = convertScenesToLines(play.scenes || [], play.title);
        
        console.log(`✅ Converted play "${play.title}":`, {
          charactersCount: characters.length,
          linesCount: lines.length,
          characterNames: characters.map(c => `${c.name} (${c.lineCount} lines)`),
          firstFewLines: lines.slice(0, 3).map(l => `${l.character}: ${l.text.substring(0, 30)}...`)
        });

        return {
          id: play.play_id,
          title: play.title,
          author: play.author || undefined,
          language: play.language || undefined,
          characters,
          lines,
          file_type: play.file_type,
          file_size: play.file_size,
          created_at: play.created_at,
          updated_at: play.updated_at,
          is_public: play.is_public,
          tags: play.tags || []
        };
      });
      
      setUserScripts(convertedScripts);
    } catch (err) {
      console.error('useScripts: Error fetching scripts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scripts';
      setError(errorMessage);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = null;
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

      console.log('useScripts: Saving play for user:', userId);
      console.log('🔍 Script data being saved:', {
        title,
        charactersCount: characters.length,
        linesCount: lines.length,
        characters: characters.map(c => `${c.name} (${c.lineCount} lines)`),
        firstFewLines: lines.slice(0, 3).map(l => `${l.character}: ${l.text.substring(0, 30)}...`)
      });

      // Ensure user exists first
      const { error: userError } = await supabase
        .from('users')
        .upsert({ id: userId }, { onConflict: 'id' });

      if (userError) {
        console.error('useScripts: User upsert error:', userError);
        throw new Error(`User creation failed: ${userError.message}`);
      }

      // Insert play
      const { data: play, error: playError } = await supabase
        .from('plays')
        .insert({
          user_id: userId,
          title,
          author,
          language,
          script_content: content,
          file_type: fileType,
          file_size: fileSize,
          tags,
          is_public: false
        })
        .select()
        .single();

      if (playError) {
        console.error('useScripts: Play save error:', playError);
        throw new Error(`Play save failed: ${playError.message}`);
      }

      // Insert characters with voice settings
      if (characters.length > 0) {
        const charactersToInsert = characters.map(char => ({
          play_id: play.play_id,
          character_name: char.name,
          line_count: char.lineCount,
          voice_settings: char.voiceSettings || {
            rate: 1.0,
            volume: 1.0,
            voiceIndex: 0
          }
        }));

        const { error: charactersError } = await supabase
          .from('characters')
          .insert(charactersToInsert);

        if (charactersError) {
          console.error('useScripts: Characters save error:', charactersError);
          throw new Error(`Characters save failed: ${charactersError.message}`);
        }
      }

      // Convert lines to scenes and insert
      const scenes = convertLinesToScenes(lines);
      console.log('🔍 Converting lines to scenes:', {
        linesCount: lines.length,
        scenesCount: scenes.length,
        scenes: scenes.map(s => ({ sceneNumber: s.sceneNumber, actNumber: s.actNumber, lineCount: s.content.split('\n').length }))
      });

      if (scenes.length > 0) {
        const scenesToInsert = scenes.map(scene => ({
          play_id: play.play_id,
          scene_number: scene.sceneNumber,
          scene_content: scene.content,
          setting: scene.setting,
          act_number: scene.actNumber
        }));

        const { error: scenesError } = await supabase
          .from('scenes')
          .insert(scenesToInsert);

        if (scenesError) {
          console.error('useScripts: Scenes save error:', scenesError);
          throw new Error(`Scenes save failed: ${scenesError.message}`);
        }
      }

      console.log('useScripts: Play saved successfully:', play.play_id);
      
      // 🔥 NEW: Re-fetch the complete play with characters and scenes including database IDs
      console.log('🔄 Re-fetching saved play with database IDs...');
      const { data: savedPlay, error: fetchError } = await supabase
        .from('plays')
        .select(`
          *,
          characters!fk_characters_play_id (
            character_id,
            character_name,
            gender,
            age_group,
            line_count,
            voice_settings
          ),
          scenes!fk_scenes_play_id (
            scene_id,
            scene_number,
            scene_content,
            setting,
            act_number
          )
        `)
        .eq('play_id', play.play_id)
        .single();

      if (fetchError) {
        console.error('useScripts: Failed to re-fetch saved play:', fetchError);
        throw new Error(`Failed to retrieve saved play: ${fetchError.message}`);
      }

      // Convert to SavedScript format with database IDs
      const savedScriptCharacters = (savedPlay.characters || []).map(char => ({
        id: char.character_id, // 🔥 Now has database ID!
        name: char.character_name,
        lineCount: char.line_count || 0,
        voiceSettings: char.voice_settings || {
          rate: 1.0,
          volume: 1.0,
          voiceIndex: 0
        }
      }));

      const savedScriptLines = convertScenesToLines(savedPlay.scenes || [], savedPlay.title);

      const savedScript: SavedScript = {
        id: savedPlay.play_id,
        title: savedPlay.title,
        author: savedPlay.author || undefined,
        language: savedPlay.language || undefined,
        characters: savedScriptCharacters,
        lines: savedScriptLines,
        file_type: savedPlay.file_type,
        file_size: savedPlay.file_size,
        created_at: savedPlay.created_at,
        updated_at: savedPlay.updated_at,
        is_public: savedPlay.is_public,
        tags: savedPlay.tags || []
      };

      console.log('✅ Successfully created SavedScript with database IDs:', {
        playId: savedScript.id,
        charactersWithIds: savedScript.characters.map(c => ({ name: c.name, id: c.id }))
      });
      
      // Refresh scripts list in background
      fetchUserScripts(userId);
      
      return { data: savedScript, error: null };
    } catch (err) {
      console.error('useScripts: Error saving script:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save script';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchUserScripts]);

  const updateCharacterVoiceSettings = async (characterId: string, voiceSettings: VoiceSettings) => {
    try {
      console.log('useScripts: Updating voice settings for character:', characterId, voiceSettings);

      const { error: updateError } = await supabase
        .from('characters')
        .update({ voice_settings: voiceSettings })
        .eq('character_id', characterId);

      if (updateError) {
        console.error('useScripts: Voice settings update error:', updateError);
        throw new Error(`Voice settings update failed: ${updateError.message}`);
      }

      console.log('useScripts: Voice settings updated successfully');
      
      // Update local state to reflect the change immediately
      setUserScripts(prev => prev.map(script => ({
        ...script,
        characters: script.characters.map(char => 
          char.id === characterId 
            ? { ...char, voiceSettings }
            : char
        )
      })));
      
      return { error: null };
    } catch (err) {
      console.error('useScripts: Error updating voice settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update voice settings';
      return { error: errorMessage };
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('useScripts: Deleting play:', scriptId);

      const { error: deleteError } = await supabase
        .from('plays')
        .delete()
        .eq('play_id', scriptId);

      if (deleteError) {
        console.error('useScripts: Delete error:', deleteError);
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      console.log('useScripts: Play deleted successfully');
      setUserScripts(prev => prev.filter(script => script.id !== scriptId));
      return { error: null };
    } catch (err) {
      console.error('useScripts: Error deleting script:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete script';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateScript = async (
    scriptId: string,
    updates: Partial<SavedScript>
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('useScripts: Updating play:', scriptId, updates);

      const { data, error: updateError } = await supabase
        .from('plays')
        .update({ 
          title: updates.title,
          author: updates.author,
          language: updates.language,
          tags: updates.tags,
          is_public: updates.is_public,
          updated_at: new Date().toISOString() 
        })
        .eq('play_id', scriptId)
        .select()
        .single();

      if (updateError) {
        console.error('useScripts: Update error:', updateError);
        throw new Error(`Update failed: ${updateError.message}`);
      }

      console.log('useScripts: Play updated successfully:', data);
      
      // Refresh scripts to get updated data
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await fetchUserScripts(user.data.user.id);
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('useScripts: Error updating script:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update script';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getDemoScripts = (language?: string): DemoScript[] => {
    // Calculate line counts for characters before returning
    const scriptsWithCalculatedCounts = DEMO_SCRIPTS.map(script => ({
      ...script,
      characters: script.characters.map(char => ({
        ...char,
        lineCount: script.lines.filter(line => line.character === char.name).length
      }))
    }));

    if (language) {
      return scriptsWithCalculatedCounts.filter(script => script.language === language);
    }
    return scriptsWithCalculatedCounts;
  };

  return {
    userScripts,
    loading,
    error,
    fetchUserScripts,
    saveScript,
    updateCharacterVoiceSettings,
    deleteScript,
    updateScript,
    getDemoScripts
  };
};

// ENHANCED Helper function to convert database scenes back to ScriptLine format
function convertScenesToLines(scenes: any[], playTitle: string): ScriptLine[] {
  console.log(`🔄 Converting scenes to lines for "${playTitle}":`, scenes.length, 'scenes');
  
  const lines: ScriptLine[] = [];
  let globalLineNumber = 1;

  // Sort scenes by act and scene number
  const sortedScenes = scenes
    .filter(scene => scene && scene.scene_content) // Filter out null/empty scenes
    .sort((a, b) => {
      const actDiff = (a.act_number || 1) - (b.act_number || 1);
      if (actDiff !== 0) return actDiff;
      return (a.scene_number || 1) - (b.scene_number || 1);
    });

  console.log(`📋 Processing ${sortedScenes.length} valid scenes`);

  sortedScenes.forEach((scene, sceneIndex) => {
    console.log(`🎭 Processing scene ${sceneIndex + 1}: Act ${scene.act_number || 1}, Scene ${scene.scene_number || 1}`);
    
    if (!scene.scene_content || typeof scene.scene_content !== 'string') {
      console.warn(`⚠️ Scene ${sceneIndex + 1} has invalid content:`, scene.scene_content);
      return;
    }
    
    // Parse scene content to extract dialogue lines
    const sceneLines = scene.scene_content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log(`📝 Scene ${sceneIndex + 1} has ${sceneLines.length} non-empty lines`);
    
    sceneLines.forEach((lineText, lineIndex) => {
      if (!lineText.trim()) return;

      // Try to extract character and dialogue
      let character = 'UNKNOWN';
      let text = lineText;
      
      // Pattern 1: CHARACTER: dialogue
      const colonMatch = lineText.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü][A-ZÇĞİÖŞÜa-zçğıöşü\s&,]+?):\s*(.+)$/);
      if (colonMatch) {
        character = colonMatch[1].trim().toUpperCase();
        text = colonMatch[2].trim();
      } else {
        // Pattern 2: Try to detect if this is a character name line (all caps, reasonable length)
        if (lineText.match(/^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s&,]{2,25}$/) && lineIndex + 1 < sceneLines.length) {
          // This might be a character name, check if next line exists and looks like dialogue
          const nextLine = sceneLines[lineIndex + 1];
          if (nextLine && !nextLine.match(/^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s&,]{2,25}$/)) {
            // Skip this line, it will be processed when we reach the dialogue line
            return;
          }
        }
        
        // Pattern 3: Check if previous line was a character name
        if (lineIndex > 0) {
          const prevLine = sceneLines[lineIndex - 1];
          if (prevLine && prevLine.match(/^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s&,]{2,25}$/)) {
            character = prevLine.trim().toUpperCase();
            text = lineText.trim();
          }
        }
      }

      // Skip stage directions and non-dialogue content
      if (text.match(/^\s*[\[\(].*[\]\)]\s*$/) || 
          text.match(/^(ENTER|EXIT|SCENE|ACT|SETTING)/i) ||
          character === 'UNKNOWN' && text.length < 10) {
        return;
      }

      // Create the script line
      const scriptLine: ScriptLine = {
        id: `${playTitle}-scene-${scene.scene_id}-line-${globalLineNumber}`,
        character: character,
        text: text,
        lineNumber: globalLineNumber++,
        actNumber: scene.act_number || 1,
        sceneNumber: scene.scene_number || 1
      };

      lines.push(scriptLine);
    });
  });

  console.log(`✅ Converted ${lines.length} total lines from ${sortedScenes.length} scenes`);
  
  // Debug: Show character distribution
  const characterCounts = lines.reduce((acc, line) => {
    acc[line.character] = (acc[line.character] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  console.log('📊 Character line distribution:', characterCounts);

  // Validate we have reasonable data
  if (lines.length === 0) {
    console.error('❌ No lines were converted! Check scene content format');
    console.log('🔍 Sample scene content:', scenes[0]?.scene_content?.substring(0, 200));
  }

  return lines;
}

// ENHANCED Helper function to convert ScriptLine array to scenes for database storage
function convertLinesToScenes(lines: ScriptLine[]): any[] {
  console.log(`🔄 Converting ${lines.length} lines to scenes`);
  
  if (lines.length === 0) {
    console.warn('⚠️ No lines to convert to scenes');
    return [];
  }

  // Group lines by act and scene
  const sceneGroups = new Map<string, { actNumber: number; sceneNumber: number; lines: ScriptLine[] }>();
  
  lines.forEach(line => {
    const actNumber = line.actNumber || 1;
    const sceneNumber = line.sceneNumber || 1;
    const key = `act-${actNumber}-scene-${sceneNumber}`;
    
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, {
        actNumber,
        sceneNumber,
        lines: []
      });
    }
    
    sceneGroups.get(key)!.lines.push(line);
  });

  console.log(`📋 Created ${sceneGroups.size} scene groups`);

  // Convert each group to a scene record
  const scenes = Array.from(sceneGroups.values()).map(group => {
    // Create scene content from lines
    const content = group.lines
      .sort((a, b) => (a.lineNumber || 0) - (b.lineNumber || 0))
      .map(line => `${line.character}: ${line.text}`)
      .join('\n');

    console.log(`🎭 Scene Act ${group.actNumber}, Scene ${group.sceneNumber}: ${group.lines.length} lines`);

    return {
      actNumber: group.actNumber,
      sceneNumber: group.sceneNumber,
      content,
      setting: null // Could be extracted from stage directions in the future
    };
  }).sort((a, b) => {
    const actDiff = a.actNumber - b.actNumber;
    if (actDiff !== 0) return actDiff;
    return a.sceneNumber - b.sceneNumber;
  });

  console.log(`✅ Converted to ${scenes.length} scenes for database storage`);
  return scenes;
}