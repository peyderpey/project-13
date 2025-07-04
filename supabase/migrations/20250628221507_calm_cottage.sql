/*
  # Update to new script database schema

  1. New Tables
    - `plays` - Core play/script information
    - `characters` - Character details linked to plays  
    - `scenes` - Scene breakdown for each play

  2. Changes
    - Replace user_scripts with new normalized structure
    - Maintain user ownership and RLS
    - Add indexes for performance

  3. Security
    - Enable RLS on all new tables
    - Users can only access their own plays and related data
*/

-- Create plays table (replaces user_scripts)
CREATE TABLE IF NOT EXISTS plays (
  play_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  language VARCHAR(50),
  script_content TEXT,
  file_type text DEFAULT 'txt',
  file_size integer DEFAULT 0,
  is_public boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  character_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id uuid REFERENCES plays(play_id) ON DELETE CASCADE NOT NULL,
  character_name VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  age_group VARCHAR(50),
  line_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS scenes (
  scene_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id uuid REFERENCES plays(play_id) ON DELETE CASCADE NOT NULL,
  scene_number integer NOT NULL,
  scene_content TEXT,
  setting VARCHAR(255),
  act_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Create policies for plays
CREATE POLICY "Users can read own plays"
  ON plays
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plays"
  ON plays
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plays"
  ON plays
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plays"
  ON plays
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for characters
CREATE POLICY "Users can read characters from own plays"
  ON characters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = characters.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert characters to own plays"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = characters.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can update characters from own plays"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = characters.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete characters from own plays"
  ON characters
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = characters.play_id 
    AND plays.user_id = auth.uid()
  ));

-- Create policies for scenes
CREATE POLICY "Users can read scenes from own plays"
  ON scenes
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = scenes.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert scenes to own plays"
  ON scenes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = scenes.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can update scenes from own plays"
  ON scenes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = scenes.play_id 
    AND plays.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete scenes from own plays"
  ON scenes
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plays 
    WHERE plays.play_id = scenes.play_id 
    AND plays.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS plays_user_id_idx ON plays(user_id);
CREATE INDEX IF NOT EXISTS plays_created_at_idx ON plays(created_at DESC);
CREATE INDEX IF NOT EXISTS plays_tags_idx ON plays USING GIN(tags);

CREATE INDEX IF NOT EXISTS characters_play_id_idx ON characters(play_id);
CREATE INDEX IF NOT EXISTS characters_name_idx ON characters(character_name);

CREATE INDEX IF NOT EXISTS scenes_play_id_idx ON scenes(play_id);
CREATE INDEX IF NOT EXISTS scenes_number_idx ON scenes(play_id, scene_number);

-- Create trigger for plays updated_at
CREATE TRIGGER update_plays_updated_at
  BEFORE UPDATE ON plays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update rehearsal_sessions to reference plays instead of user_scripts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rehearsal_sessions' AND column_name = 'script_id') THEN
    ALTER TABLE rehearsal_sessions RENAME COLUMN script_id TO play_id;
    
    -- Drop and recreate foreign key constraint
    ALTER TABLE rehearsal_sessions DROP CONSTRAINT IF EXISTS rehearsal_sessions_script_id_fkey;
    ALTER TABLE rehearsal_sessions ADD CONSTRAINT rehearsal_sessions_play_id_fkey 
      FOREIGN KEY (play_id) REFERENCES plays(play_id) ON DELETE CASCADE;
      
    -- Update index
    DROP INDEX IF EXISTS rehearsal_sessions_script_id_idx;
    CREATE INDEX IF NOT EXISTS rehearsal_sessions_play_id_idx ON rehearsal_sessions(play_id);
  END IF;
END $$;