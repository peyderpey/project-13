import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { AppSettings, AccuracyLevel, VoiceSettings, UserProgress, CharacterPerformance, ScriptCharacterHistory } from '../types';
import { Language, detectBrowserLanguage } from '../i18n';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_KEY = 'rehearsify-settings';

function getOrCreateDeviceId() {
  let id = localStorage.getItem('rehearsify-deviceId') || '';
  if (!id) {
    id = uuidv4();
    localStorage.setItem('rehearsify-deviceId', id);
  }
  return id;
}

const defaultSettings: AppSettings = {
  accuracyLevel: 'semantic',
  voiceSettings: { rate: 1.0, volume: 1.0, voiceIndex: 0 },
  language: 'en',
  autoAdvance: true,
  autoRecordTimeout: 5,
  deviceId: getOrCreateDeviceId(),
  theme: 'system', // Add theme to default settings
  // Add default display settings
  hideLevel: 'show-all',
  displayMode: 'full',
  practiceTemplate: 'chat'
};

export function useAppSettings() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Try to load from localStorage
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const loaded = JSON.parse(raw);
        // Ensure all default values are present
        const merged = { ...defaultSettings, ...loaded };
        if (!merged.deviceId) {
          merged.deviceId = getOrCreateDeviceId();
        }
        return merged;
      } catch {}
    }
    // Fallback to browser language
    const browserLang = detectBrowserLanguage();
    return { ...defaultSettings, language: browserLang };
  });

  // Load from DB if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      (async () => {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setSettings((prev) => {
            // Ensure all default values are present when merging from DB
            const merged = { ...defaultSettings, ...prev, ...data.settings };
            localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
            return merged;
          });
        } else if (error) {
          // If no settings in DB, create default record
          const currentSettings = settings;
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id,
              settings: currentSettings
            });
          if (insertError) {
            console.warn('Failed to create user settings:', insertError);
          }
        }
      })();
    }
  }, [isAuthenticated, user]); // Removed settings dependency to prevent infinite loops

  // Helper to update rehearsal progress for a script/character
  const updateProgress = useCallback((scriptId: string, character: string, progressObj: UserProgress) => {
    setSettings(prev => {
      const key = `${scriptId}-${character}`;
      const updated = {
        ...prev,
        progress: {
          ...(prev.progress || {}),
          [key]: progressObj
        }
      };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      if (isAuthenticated && user) {
        supabase.from('user_settings').upsert({
          user_id: user.id,
          settings: updated
        });
      }
      return updated;
    });
  }, [isAuthenticated, user]);

  // updateSettings should not overwrite progress unless explicitly set
  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings(prev => {
        const updated = {
          ...prev,
          ...newSettings,
          progress: newSettings.progress !== undefined ? newSettings.progress : prev.progress
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
        if (isAuthenticated && user) {
          supabase.from('user_settings').upsert({
            user_id: user.id,
            settings: updated
          });
        }
        return updated;
      });
    },
    [isAuthenticated, user]
  );

  // Clear all settings from localStorage
  const clearSettings = useCallback(() => {
    localStorage.removeItem(LOCAL_KEY);
  }, []);

  // Helper to update character performance
  const updateCharacterPerformance = useCallback((scriptId: string, character: string, accuracy: number) => {
    setSettings(prev => {
      const key = `${scriptId}-${character}`;
      const existing = prev.characterPerformance?.[key];
      const now = new Date().toISOString();
      
      // Keep only last 5 scores, weighted by recent performance
      const recentScores = existing?.recentScores || [];
      const newScores = [accuracy, ...recentScores.slice(0, 4)]; // Add new score, keep last 4
      
      // Calculate weighted average (recent scores count more)
      const weights = [1, 0.8, 0.6, 0.4, 0.2]; // Most recent gets full weight
      const weightedSum = newScores.reduce((sum, score, index) => sum + (score * weights[index]), 0);
      const weightSum = weights.slice(0, newScores.length).reduce((sum, weight) => sum + weight, 0);
      const averageAccuracy = weightSum > 0 ? Math.round(weightedSum / weightSum) : accuracy;
      
      const performance: CharacterPerformance = {
        scriptId,
        character,
        lastPlayed: now,
        averageAccuracy,
        recentScores: newScores,
        totalSessions: (existing?.totalSessions || 0) + 1
      };
      
      const updated = {
        ...prev,
        characterPerformance: {
          ...(prev.characterPerformance || {}),
          [key]: performance
        }
      };
      
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      if (isAuthenticated && user) {
        supabase.from('user_settings').upsert({
          user_id: user.id,
          settings: updated
        });
      }
      return updated;
    });
  }, [isAuthenticated, user]);

  // Helper to update script character history
  const updateScriptHistory = useCallback((scriptId: string, character: string) => {
    setSettings(prev => {
      const now = new Date().toISOString();
      const history: ScriptCharacterHistory = {
        scriptId,
        lastSelectedCharacter: character,
        lastPlayed: now
      };
      
      const updated = {
        ...prev,
        scriptHistory: {
          ...(prev.scriptHistory || {}),
          [scriptId]: history
        }
      };
      
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      if (isAuthenticated && user) {
        supabase.from('user_settings').upsert({
          user_id: user.id,
          settings: updated
        });
      }
      return updated;
    });
  }, [isAuthenticated, user]);

  // Helper to get performance rating
  const getPerformanceRating = useCallback((averageAccuracy: number): { rating: string; emoji: string } => {
    if (averageAccuracy >= 85) return { rating: 'Excellent', emoji: '😊' };
    if (averageAccuracy >= 70) return { rating: 'Good', emoji: '😐' };
    return { rating: 'Can be Better', emoji: '😞' };
  }, []);

  return {
    settings,
    updateSettings,
    clearSettings,
    progress: settings.progress || {},
    updateProgress,
    characterPerformance: settings.characterPerformance || {},
    scriptHistory: settings.scriptHistory || {},
    updateCharacterPerformance,
    updateScriptHistory,
    getPerformanceRating
  };
} 