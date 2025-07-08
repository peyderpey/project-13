/*
  # Comprehensive RLS Fix

  This migration ensures all RLS policies are properly configured
  and working correctly for all tables.
*/

-- Step 1: Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can read own plays" ON plays;
DROP POLICY IF EXISTS "Users can insert own plays" ON plays;
DROP POLICY IF EXISTS "Users can update own plays" ON plays;
DROP POLICY IF EXISTS "Users can delete own plays" ON plays;

DROP POLICY IF EXISTS "Users can read characters from own plays" ON characters;
DROP POLICY IF EXISTS "Users can insert characters to own plays" ON characters;
DROP POLICY IF EXISTS "Users can update characters from own plays" ON characters;
DROP POLICY IF EXISTS "Users can delete characters from own plays" ON characters;

DROP POLICY IF EXISTS "Users can read scenes from own plays" ON scenes;
DROP POLICY IF EXISTS "Users can insert scenes to own plays" ON scenes;
DROP POLICY IF EXISTS "Users can update scenes from own plays" ON scenes;
DROP POLICY IF EXISTS "Users can delete scenes from own plays" ON scenes;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can insert their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can update their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can delete their own rehearsal sessions" ON rehearsal_sessions;

-- Step 2: Create new, simplified RLS policies for plays
CREATE POLICY "Users can read own plays" ON plays
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plays" ON plays
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plays" ON plays
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plays" ON plays
  FOR DELETE USING (user_id = auth.uid());

-- Step 3: Create new, simplified RLS policies for characters
CREATE POLICY "Users can read characters from own plays" ON characters
  FOR SELECT USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert characters to own plays" ON characters
  FOR INSERT WITH CHECK (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update characters from own plays" ON characters
  FOR UPDATE USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete characters from own plays" ON characters
  FOR DELETE USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

-- Step 4: Create new, simplified RLS policies for scenes
CREATE POLICY "Users can read scenes from own plays" ON scenes
  FOR SELECT USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert scenes to own plays" ON scenes
  FOR INSERT WITH CHECK (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update scenes from own plays" ON scenes
  FOR UPDATE USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete scenes from own plays" ON scenes
  FOR DELETE USING (
    play_id IN (SELECT play_id FROM plays WHERE user_id = auth.uid())
  );

-- Step 5: Create RLS policies for user_settings
CREATE POLICY "Users can read their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Step 6: Create RLS policies for rehearsal_sessions
CREATE POLICY "Users can read their own rehearsal sessions" ON rehearsal_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rehearsal sessions" ON rehearsal_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rehearsal sessions" ON rehearsal_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rehearsal sessions" ON rehearsal_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Step 7: Ensure RLS is enabled on all tables
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Step 8: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add voice_settings to characters if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'characters' AND column_name = 'voice_settings'
  ) THEN
    ALTER TABLE characters ADD COLUMN voice_settings JSONB DEFAULT '{}';
  END IF;

  -- Add voice_settings to scenes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'voice_settings'
  ) THEN
    ALTER TABLE scenes ADD COLUMN voice_settings JSONB DEFAULT '{}';
  END IF;

  -- Rename genre to gender in characters if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'characters' AND column_name = 'genre'
  ) THEN
    ALTER TABLE characters RENAME COLUMN genre TO gender;
  END IF;
END $$;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plays_user_id ON plays(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_play_id ON characters(play_id);
CREATE INDEX IF NOT EXISTS idx_scenes_play_id ON scenes(play_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_number ON scenes(play_id, scene_number);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_user_id ON rehearsal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_play_id ON rehearsal_sessions(play_id); 