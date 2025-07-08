/*
  # Fix User Settings Table RLS Policies

  The user_settings table is returning 406 errors due to RLS policy issues.
  This migration fixes the RLS policies for the user_settings table.
*/

-- Step 1: Drop existing RLS policies for user_settings table
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Step 2: Create proper RLS policies for user_settings table
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (user_id = auth.uid());

-- Step 3: Ensure RLS is enabled on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id); 