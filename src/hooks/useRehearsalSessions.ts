import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProgress } from '../types';

export const useRehearsalSessions = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Background sync: Save localStorage progress to database
  const syncProgressToDatabase = useCallback(async (
    scriptId: string,
    character: string,
    progress: UserProgress
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping database sync');
      return { success: true }; // Not an error, just offline
    }

    try {
      console.log('Background sync: Saving rehearsal progress to database:', {
        scriptId,
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
      const { data: existingSession } = await supabase
        .from('rehearsal_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('play_id', scriptId)
        .eq('character_name', character)
        .single();

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
          console.error('Failed to update rehearsal session:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('rehearsal_sessions')
          .insert({
            user_id: user.id,
            play_id: scriptId,
            character_name: character,
            session_data: sessionData,
            accuracy_scores: progress.accuracyScores,
            completed_lines: progress.completedLines,
            total_lines: progress.completedLines.length + Object.keys(progress.accuracyScores).length
          });

        if (insertError) {
          console.error('Failed to create rehearsal session:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      console.log('Background sync: Successfully saved rehearsal progress to database');
      return { success: true };
    } catch (err) {
      console.error('Error in background sync:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync progress';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, user]);

  // Load rehearsal progress from database (for StartingPointSelector)
  const loadProgressFromDatabase = useCallback(async (
    scriptId: string,
    character: string
  ): Promise<UserProgress | null> => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, cannot load from database');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading rehearsal progress from database:', { scriptId, character });

      const { data: session, error } = await supabase
        .from('rehearsal_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('play_id', scriptId)
        .eq('character_name', character)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No session found, not an error
          console.log('No rehearsal session found for this script/character');
          return null;
        }
        console.error('Failed to load rehearsal session:', error);
        setError(error.message);
        return null;
      }

      if (!session) {
        console.log('No rehearsal session found');
        return null;
      }

      // Convert database format to UserProgress
      const progress: UserProgress = {
        scriptId: session.session_data?.scriptId || scriptId,
        character: session.session_data?.character || character,
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Sync all localStorage progress to database (called on login)
  const syncAllLocalProgress = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      console.log('Syncing all localStorage progress to database...');
      
      // Get all localStorage keys that match our progress pattern
      const progressKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('-')) {
          progressKeys.push(key);
        }
      }

      let syncedCount = 0;
      for (const key of progressKeys) {
        try {
          const progressData = localStorage.getItem(key);
          if (progressData) {
            const progress: UserProgress = JSON.parse(progressData);
            
            // Extract scriptId and character from the key (format: "scriptTitle-character")
            const parts = key.split('-');
            if (parts.length >= 2) {
              const character = parts[parts.length - 1];
              const scriptId = parts.slice(0, -1).join('-');
              
              const result = await syncProgressToDatabase(scriptId, character, progress);
              if (result.success) {
                syncedCount++;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to sync progress for key ${key}:`, err);
        }
      }

      console.log(`Synced ${syncedCount} progress items to database`);
    } catch (err) {
      console.error('Error syncing all local progress:', err);
    }
  }, [isAuthenticated, user, syncProgressToDatabase]);

  // Auto-sync on login
  useEffect(() => {
    if (isAuthenticated && user) {
      syncAllLocalProgress();
    }
  }, [isAuthenticated, user, syncAllLocalProgress]);

  // Get all rehearsal sessions for a user (for future features)
  const getUserSessions = useCallback(async (): Promise<any[]> => {
    if (!isAuthenticated || !user) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data: sessions, error } = await supabase
        .from('rehearsal_sessions')
        .select(`
          *,
          plays!inner (
            play_id,
            title,
            author
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load user sessions:', error);
        setError(error.message);
        return [];
      }

      return sessions || [];
    } catch (err) {
      console.error('Error loading user sessions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  return {
    syncProgressToDatabase,
    loadProgressFromDatabase,
    syncAllLocalProgress,
    getUserSessions,
    loading,
    error
  };
}; 