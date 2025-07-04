import { supabase } from '../lib/supabase';
import { UserProgress } from '../types';

// List of demo script titles that don't exist in the database
const DEMO_SCRIPT_TITLES = [
  'Pygmalion',
  'Salomé',
  'Oscar Wilde - Salome',
  'Bernard Shaw - Pygmalion'
];

// Cache for play_id lookups to reduce database calls
const playIdCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  playId: string | null;
  timestamp: number;
}

// Helper function to get play_id from script title with caching
const getPlayIdFromTitle = async (userId: string, scriptTitle: string): Promise<string | null> => {
  try {
    // Check if this is a demo script
    if (DEMO_SCRIPT_TITLES.includes(scriptTitle)) {
      console.log('📚 Demo script detected:', scriptTitle, '- skipping database sync');
      return null;
    }

    // Check cache first
    const cacheKey = `${userId}:${scriptTitle}`;
    const cached = playIdCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 Using cached play_id for:', scriptTitle);
      return cached.playId;
    }

    console.log('🔍 Looking up play_id for:', { userId, scriptTitle });
    
    // Get the play_id from the script title
    const { data: play, error } = await supabase
      .from('plays')
      .select('play_id')
      .eq('user_id', userId)
      .eq('title', scriptTitle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ No exact match found for title:', scriptTitle);
        
        // Try case-insensitive search
        const { data: caseInsensitivePlay } = await supabase
          .from('plays')
          .select('play_id, title')
          .eq('user_id', userId)
          .ilike('title', scriptTitle)
          .single();
          
        if (caseInsensitivePlay) {
          console.log('✅ Found case-insensitive match:', caseInsensitivePlay.title);
          // Cache the result
          playIdCache.set(cacheKey, { playId: caseInsensitivePlay.play_id, timestamp: Date.now() });
          return caseInsensitivePlay.play_id;
        }
        
        // Try partial match
        const { data: partialPlay } = await supabase
          .from('plays')
          .select('play_id, title')
          .eq('user_id', userId)
          .ilike('title', `%${scriptTitle}%`)
          .limit(1)
          .single();
          
        if (partialPlay) {
          console.log('✅ Found partial match:', partialPlay.title);
          // Cache the result
          playIdCache.set(cacheKey, { playId: partialPlay.play_id, timestamp: Date.now() });
          return partialPlay.play_id;
        }
        
        // Cache null result
        playIdCache.set(cacheKey, { playId: null, timestamp: Date.now() });
        return null;
      }
      console.error('Error getting play_id from title:', error);
      return null;
    }

    console.log('✅ Found exact match for play_id:', play?.play_id);
    // Cache the result
    playIdCache.set(cacheKey, { playId: play?.play_id || null, timestamp: Date.now() });
    return play?.play_id || null;
  } catch (err) {
    console.error('Error getting play_id from title:', err);
    return null;
  }
};

// Debounced sync function to reduce database calls
let syncTimeout: NodeJS.Timeout | null = null;
let pendingSync: { userId: string; scriptTitle: string; character: string; progress: UserProgress } | null = null;

// Background sync utility with debouncing
export const syncProgressToDatabase = async (
  userId: string | undefined,
  scriptTitle: string,
  character: string,
  progress: UserProgress
): Promise<void> => {
  if (!userId) {
    console.log('No user ID, skipping background sync');
    return;
  }

  // Check if this is a demo script
  if (DEMO_SCRIPT_TITLES.includes(scriptTitle)) {
    console.log('📚 Demo script detected:', scriptTitle, '- skipping database sync');
    return;
  }

  // Store the latest progress data
  pendingSync = { userId, scriptTitle, character, progress };

  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Set new timeout for debounced sync
  syncTimeout = setTimeout(async () => {
    if (!pendingSync) return;

    const { userId, scriptTitle, character, progress } = pendingSync;
    pendingSync = null;

    try {
      // Get the play_id from the script title
      const playId = await getPlayIdFromTitle(userId, scriptTitle);
      if (!playId) {
        console.log('❌ Could not find play_id for script title:', scriptTitle);
        return;
      }

      console.log('Background sync: Saving rehearsal progress to database:', {
        scriptTitle,
        playId,
        character,
        progress: {
          lastLineIndex: progress.lastLineIndex,
          completedLines: progress.completedLines.length,
          accuracyScores: Object.keys(progress.accuracyScores).length
        }
      });

      const sessionData = {
        lastActNumber: progress.lastActNumber,
        lastSceneNumber: progress.lastSceneNumber,
        lastLineIndex: progress.lastLineIndex,
        scriptId: progress.scriptId,
        character: progress.character
      };

      // Check if session already exists
      const { data: existingSession, error: checkError } = await supabase
        .from('rehearsal_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('play_id', playId)
        .eq('character_name', character)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing session:', checkError);
        return;
      }

      if (existingSession) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('rehearsal_sessions')
          .update({
            session_data: sessionData,
            accuracy_scores: progress.accuracyScores,
            completed_lines: progress.completedLines,
            total_lines: progress.completedLines.length + Object.keys(progress.accuracyScores).length,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSession.id);

        if (updateError) {
          console.error('Background sync: Failed to update rehearsal session:', updateError);
          return;
        }
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('rehearsal_sessions')
          .insert({
            user_id: userId,
            play_id: playId,
            character_name: character,
            session_data: sessionData,
            accuracy_scores: progress.accuracyScores,
            completed_lines: progress.completedLines,
            total_lines: progress.completedLines.length + Object.keys(progress.accuracyScores).length
          });

        if (insertError) {
          console.error('Background sync: Failed to create rehearsal session:', insertError);
          return;
        }
      }

      console.log('✅ Background sync: Successfully saved rehearsal progress to database');
    } catch (err) {
      console.error('Background sync: Error syncing progress:', err);
    }
  }, 1000); // Debounce for 1 second
};

// Load progress from database (for StartingPointSelector)
export const loadProgressFromDatabase = async (
  userId: string | undefined,
  scriptTitle: string,
  character: string
): Promise<UserProgress | null> => {
  if (!userId) {
    console.log('No user ID, skipping database load');
    return null;
  }

  // Check if this is a demo script
  if (DEMO_SCRIPT_TITLES.includes(scriptTitle)) {
    console.log('📚 Demo script detected:', scriptTitle, '- skipping database load');
    return null;
  }

  try {
    console.log('Loading rehearsal progress from database:', { scriptTitle, character });

    // Get the play_id from the script title
    const playId = await getPlayIdFromTitle(userId, scriptTitle);
    if (!playId) {
      console.log('❌ Could not find play_id for script title:', scriptTitle);
      return null;
    }

    // Get the rehearsal session
    const { data: session, error } = await supabase
      .from('rehearsal_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('play_id', playId)
      .eq('character_name', character)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No existing rehearsal session found');
        return null;
      }
      console.error('Error loading rehearsal progress:', error);
      return null;
    }

    if (!session) {
      console.log('No rehearsal session found');
      return null;
    }

    const progress: UserProgress = {
      scriptId: session.session_data?.scriptId || scriptTitle,
      character: session.character_name,
      lastActNumber: session.session_data?.lastActNumber || 1,
      lastSceneNumber: session.session_data?.lastSceneNumber || 1,
      lastLineIndex: session.session_data?.lastLineIndex || 0,
      completedLines: session.completed_lines || [],
      accuracyScores: session.accuracy_scores || {}
    };

    console.log('Successfully loaded rehearsal progress from database:', {
      lastLineIndex: progress.lastLineIndex,
      completedLines: progress.completedLines.length,
      accuracyScores: Object.keys(progress.accuracyScores).length
    });

    return progress;
  } catch (err) {
    console.error('Error loading rehearsal progress:', err);
    return null;
  }
};

// Clear cache (useful for testing or when scripts are updated)
export const clearProgressCache = () => {
  playIdCache.clear();
  console.log('📋 Progress cache cleared');
}; 