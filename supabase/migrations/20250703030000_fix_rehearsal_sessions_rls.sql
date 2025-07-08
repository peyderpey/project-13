/*
  # Fix Rehearsal Sessions Table RLS Policies

  The rehearsal_sessions table is returning 406 errors due to RLS policy issues.
  This migration fixes the RLS policies for the rehearsal_sessions table.
*/

-- Step 1: Drop existing RLS policies for rehearsal_sessions table
DROP POLICY IF EXISTS "Users can view their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can insert their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can update their own rehearsal sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can delete their own rehearsal sessions" ON rehearsal_sessions;

-- Step 2: Create proper RLS policies for rehearsal_sessions table
CREATE POLICY "Users can view their own rehearsal sessions" ON rehearsal_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rehearsal sessions" ON rehearsal_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rehearsal sessions" ON rehearsal_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rehearsal sessions" ON rehearsal_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Step 3: Ensure RLS is enabled on rehearsal_sessions table
ALTER TABLE rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_user_id ON rehearsal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_play_id ON rehearsal_sessions(play_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_character ON rehearsal_sessions(user_id, play_id, character); 