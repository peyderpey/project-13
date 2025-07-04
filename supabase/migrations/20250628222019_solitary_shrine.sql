/*
  # Remove newsletter subscriptions functionality

  1. Clean up
    - Check if newsletter_subscriptions table exists before dropping policies
    - Drop the table if it exists
    - Drop any related indexes

  2. Safety
    - Use conditional logic to avoid errors with non-existent tables
    - Ensure migration can run safely regardless of current state
*/

-- Use DO block to conditionally drop policies only if table exists
DO $$
BEGIN
  -- Check if the table exists before trying to drop policies
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'newsletter_subscriptions'
  ) THEN
    -- Drop policies if table exists
    DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
    DROP POLICY IF EXISTS "Users can read their own subscription" ON newsletter_subscriptions;
    DROP POLICY IF EXISTS "Users can update their own subscription" ON newsletter_subscriptions;
    
    -- Drop the table
    DROP TABLE newsletter_subscriptions;
  END IF;
END $$;

-- Drop any indexes that might have been created (these can be dropped even if table doesn't exist)
DROP INDEX IF EXISTS newsletter_subscriptions_email_idx;
DROP INDEX IF EXISTS newsletter_subscriptions_created_at_idx;