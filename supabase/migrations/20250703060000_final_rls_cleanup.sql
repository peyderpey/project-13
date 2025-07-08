-- Final RLS Cleanup Migration
-- This migration fixes RLS policies for user_settings and rehearsal_sessions

-- Drop existing rehearsal_sessions policies
DROP POLICY IF EXISTS "Users can read own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can read their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can insert their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can update their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can delete their own rehearsal sessions" ON rehearsal_sessions;

-- Create new rehearsal_sessions policies
CREATE POLICY "Users can read their own rehearsal sessions" ON rehearsal_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rehearsal sessions" ON rehearsal_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rehearsal sessions" ON rehearsal_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rehearsal sessions" ON rehearsal_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Drop existing user_settings policies
DROP POLICY IF EXISTS "Users can read their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Create new user_settings policies
CREATE POLICY "Users can read their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plays_user_id ON plays(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_play_id ON characters(play_id);
CREATE INDEX IF NOT EXISTS idx_scenes_play_id ON scenes(play_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_number ON scenes(play_id, scene_number);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_user_id ON rehearsal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_play_id ON rehearsal_sessions(play_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_character ON rehearsal_sessions(user_id, play_id, character_name); 