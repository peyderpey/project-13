/*
  # Remove newsletter subscriptions table

  This migration safely removes the newsletter_subscriptions table and related objects
  if they exist, without throwing errors if they don't exist.
*/

-- Use DO block to safely drop objects only if they exist
DO $$ 
BEGIN
    -- Check if table exists before dropping policies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'newsletter_subscriptions') THEN
        -- Drop policies if they exist
        DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "Users can read their own subscription" ON newsletter_subscriptions;
        DROP POLICY IF EXISTS "Users can update their own subscription" ON newsletter_subscriptions;
        
        -- Drop indexes if they exist
        DROP INDEX IF EXISTS newsletter_subscriptions_email_idx;
        DROP INDEX IF EXISTS newsletter_subscriptions_created_at_idx;
        
        -- Drop the table
        DROP TABLE newsletter_subscriptions;
        
        RAISE NOTICE 'Successfully removed newsletter_subscriptions table and related objects';
    ELSE
        RAISE NOTICE 'newsletter_subscriptions table does not exist, nothing to remove';
    END IF;
END $$;