/*
  # Remove newsletter subscriptions functionality

  1. Drops
    - Drop all policies for newsletter_subscriptions table
    - Drop newsletter_subscriptions table if it exists

  2. Cleanup
    - Remove any orphaned references
*/

-- Drop policies for newsletter_subscriptions if they exist
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscription" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON newsletter_subscriptions;

-- Drop the newsletter_subscriptions table if it exists
DROP TABLE IF EXISTS newsletter_subscriptions;

-- Drop any indexes that might have been created for newsletter_subscriptions
DROP INDEX IF EXISTS newsletter_subscriptions_email_idx;
DROP INDEX IF EXISTS newsletter_subscriptions_created_at_idx;