/*
  # Create user scripts and rehearsal sessions tables

  1. New Tables
    - `user_scripts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `content` (text)
      - `characters` (jsonb)
      - `lines` (jsonb)
      - `file_type` (text)
      - `file_size` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_public` (boolean)
      - `tags` (text array)

    - `rehearsal_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `script_id` (uuid, foreign key to user_scripts)
      - `character_name` (text)
      - `session_data` (jsonb)
      - `accuracy_scores` (jsonb)
      - `completed_lines` (integer array)
      - `total_lines` (integer)
      - `session_duration` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_scripts table
CREATE TABLE IF NOT EXISTS user_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  characters jsonb NOT NULL DEFAULT '[]'::jsonb,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_type text NOT NULL DEFAULT 'txt',
  file_size integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[]
);

-- Create rehearsal_sessions table
CREATE TABLE IF NOT EXISTS rehearsal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id uuid REFERENCES user_scripts(id) ON DELETE CASCADE NOT NULL,
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
ALTER TABLE user_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_scripts
CREATE POLICY "Users can read own scripts"
  ON user_scripts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON user_scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON user_scripts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON user_scripts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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
CREATE INDEX IF NOT EXISTS user_scripts_user_id_idx ON user_scripts(user_id);
CREATE INDEX IF NOT EXISTS user_scripts_created_at_idx ON user_scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS user_scripts_tags_idx ON user_scripts USING GIN(tags);

CREATE INDEX IF NOT EXISTS rehearsal_sessions_user_id_idx ON rehearsal_sessions(user_id);
CREATE INDEX IF NOT EXISTS rehearsal_sessions_script_id_idx ON rehearsal_sessions(script_id);
CREATE INDEX IF NOT EXISTS rehearsal_sessions_created_at_idx ON rehearsal_sessions(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_scripts_updated_at
  BEFORE UPDATE ON user_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rehearsal_sessions_updated_at
  BEFORE UPDATE ON rehearsal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();