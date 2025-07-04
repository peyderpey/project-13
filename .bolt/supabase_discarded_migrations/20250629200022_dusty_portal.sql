/*
  # Remove Newsletter Functionality

  1. Tables
    - Drop newsletter_subscriptions table if it exists
  
  2. Security
    - Remove any newsletter-related RLS policies
    
  3. Functions
    - Remove any newsletter-related functions
*/

-- Remove newsletter table if it exists
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;

-- Remove any newsletter-related policies (in case they exist on other tables)
DO $$
BEGIN
  -- Try to drop newsletter policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname LIKE '%newsletter%'
  ) THEN
    -- Drop policies that contain 'newsletter' in their name
    DECLARE
      pol RECORD;
    BEGIN
      FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE policyname ILIKE '%newsletter%'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
          pol.policyname, pol.schemaname, pol.tablename);
      END LOOP;
    END;
  END IF;
END $$;

-- Remove any newsletter-related functions
DROP FUNCTION IF EXISTS handle_newsletter_subscription() CASCADE;
DROP FUNCTION IF EXISTS validate_newsletter_email() CASCADE;
DROP FUNCTION IF EXISTS send_newsletter_confirmation() CASCADE;

-- Remove any newsletter-related triggers
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN 
    SELECT trigger_name, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_name ILIKE '%newsletter%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
      trig.trigger_name, trig.event_object_table);
  END LOOP;
END $$;