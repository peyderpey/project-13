-- Fix RLS policies for plays table to allow users to manage their own plays

-- Allow authenticated users to insert their own plays
DROP POLICY IF EXISTS "Users can insert their own plays" ON plays;
CREATE POLICY "Users can insert their own plays"
  ON plays
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to select their own plays
DROP POLICY IF EXISTS "Users can select their own plays" ON plays;
CREATE POLICY "Users can select their own plays"
  ON plays
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to update their own plays
DROP POLICY IF EXISTS "Users can update their own plays" ON plays;
CREATE POLICY "Users can update their own plays"
  ON plays
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to delete their own plays
DROP POLICY IF EXISTS "Users can delete their own plays" ON plays;
CREATE POLICY "Users can delete their own plays"
  ON plays
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()); 