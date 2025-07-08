/*
  # Fix Scenes Table RLS Policies

  The scenes table is failing to save due to RLS policy violations.
  This migration fixes the RLS policies for the scenes table.
*/

-- Step 1: Drop existing RLS policies for scenes table
DROP POLICY IF EXISTS "Users can view scenes from their plays" ON scenes;
DROP POLICY IF EXISTS "Users can insert scenes for their plays" ON scenes;
DROP POLICY IF EXISTS "Users can update scenes from their plays" ON scenes;
DROP POLICY IF EXISTS "Users can delete scenes from their plays" ON scenes;

-- Step 2: Create proper RLS policies for scenes table
CREATE POLICY "Users can view scenes from their plays" ON scenes
  FOR SELECT USING (
    play_id IN (
      SELECT play_id FROM plays WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scenes for their plays" ON scenes
  FOR INSERT WITH CHECK (
    play_id IN (
      SELECT play_id FROM plays WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scenes from their plays" ON scenes
  FOR UPDATE USING (
    play_id IN (
      SELECT play_id FROM plays WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scenes from their plays" ON scenes
  FOR DELETE USING (
    play_id IN (
      SELECT play_id FROM plays WHERE user_id = auth.uid()
    )
  );

-- Step 3: Ensure RLS is enabled on scenes table
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the scenes table structure
-- Make sure the scenes table has the correct columns
DO $$
BEGIN
  -- Check if voice_settings column exists in scenes table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'voice_settings'
  ) THEN
    -- Add voice_settings column if it doesn't exist
    ALTER TABLE scenes ADD COLUMN voice_settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- Step 5: Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_play_id ON scenes(play_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_number ON scenes(play_id, scene_number); 