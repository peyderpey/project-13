/*
  # Fix rehearsal_sessions table structure

  1. Issues to Fix
    - Ensure rehearsal_sessions table has correct column names (play_id instead of script_id)
    - Update RLS policies to work with the new structure
    - Add missing indexes

  2. Changes
    - Drop and recreate rehearsal_sessions table with correct structure
    - Update RLS policies
    - Add proper indexes
*/

-- Drop existing rehearsal_sessions table if it exists
DROP TABLE IF EXISTS rehearsal_sessions CASCADE;

-- Recreate rehearsal_sessions table with correct structure
CREATE TABLE rehearsal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  play_id uuid REFERENCES plays(play_id) ON DELETE CASCADE NOT NULL,
  character_name text NOT NULL,
  session_data jsonb DEFAULT '{}'::jsonb,
  accuracy_scores jsonb DEFAULT '{}'::jsonb,
  completed_lines integer[] DEFAULT '{}'::integer[],
  total_lines integer NOT NULL DEFAULT 0,
  session_duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for rehearsal_sessions
CREATE POLICY "Users can read own sessions"
  ON rehearsal_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON rehearsal_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON rehearsal_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON rehearsal_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS rehearsal_sessions_user_id_idx ON rehearsal_sessions(user_id);
CREATE INDEX IF NOT EXISTS rehearsal_sessions_play_id_idx ON rehearsal_sessions(play_id);
CREATE INDEX IF NOT EXISTS rehearsal_sessions_character_name_idx ON rehearsal_sessions(character_name);
CREATE INDEX IF NOT EXISTS rehearsal_sessions_created_at_idx ON rehearsal_sessions(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_rehearsal_sessions_updated_at
  BEFORE UPDATE ON rehearsal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 