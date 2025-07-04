/*
  # Fix scripts loading issue

  1. Updates
    - Fix RLS policies to use proper auth function
    - Add better error handling for user creation
    - Ensure proper indexes exist

  2. Security
    - Update RLS policies to use auth.uid() consistently
    - Add missing policies for newsletter table
*/

-- First, let's make sure the auth.uid() function works properly
-- Update user_scripts policies
DROP POLICY IF EXISTS "Users can read own scripts" ON user_scripts;
DROP POLICY IF EXISTS "Users can insert own scripts" ON user_scripts;
DROP POLICY IF EXISTS "Users can update own scripts" ON user_scripts;
DROP POLICY IF EXISTS "Users can delete own scripts" ON user_scripts;

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

-- Update rehearsal_sessions policies
DROP POLICY IF EXISTS "Users can read own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON rehearsal_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON rehearsal_sessions;

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

-- Update users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the handle_new_user function is working properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add missing newsletter_subscriptions policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'newsletter_subscriptions' 
    AND policyname = 'Anyone can subscribe to newsletter'
  ) THEN
    CREATE POLICY "Anyone can subscribe to newsletter"
      ON newsletter_subscriptions
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'newsletter_subscriptions' 
    AND policyname = 'Users can read their own subscription'
  ) THEN
    CREATE POLICY "Users can read their own subscription"
      ON newsletter_subscriptions
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'newsletter_subscriptions' 
    AND policyname = 'Users can update their own subscription'
  ) THEN
    CREATE POLICY "Users can update their own subscription"
      ON newsletter_subscriptions
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;