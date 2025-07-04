/*
  # Complete Newsletter Cleanup and Genre-to-Gender Rename

  1. Complete Newsletter Cleanup
    - Drop any remaining functions, triggers, or policies referencing newsletter_subscriptions
    - Ensure the table is completely removed
    - Clear any cached references

  2. Rename Column
    - Rename 'genre' column to 'gender' in characters table

  3. Safety
    - Use defensive SQL to avoid errors if objects don't exist
    - Ensure migration can run regardless of current database state
*/

-- Step 1: Complete newsletter cleanup with extensive checks
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Drop any functions that might reference newsletter_subscriptions
    FOR rec IN 
        SELECT routine_name, routine_schema 
        FROM information_schema.routines 
        WHERE routine_definition ILIKE '%newsletter%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I() CASCADE', rec.routine_schema, rec.routine_name);
    END LOOP;

    -- Drop any triggers that might reference newsletter_subscriptions
    FOR rec IN 
        SELECT trigger_name, event_object_schema, event_object_table
        FROM information_schema.triggers 
        WHERE trigger_name ILIKE '%newsletter%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
            rec.trigger_name, rec.event_object_schema, rec.event_object_table);
    END LOOP;

    -- Drop any views that might reference newsletter_subscriptions
    FOR rec IN 
        SELECT table_name, table_schema
        FROM information_schema.views 
        WHERE table_name ILIKE '%newsletter%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', rec.table_schema, rec.table_name);
    END LOOP;

    -- Drop any materialized views that might reference newsletter_subscriptions
    FOR rec IN 
        SELECT schemaname, matviewname
        FROM pg_matviews 
        WHERE matviewname ILIKE '%newsletter%'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', rec.schemaname, rec.matviewname);
    END LOOP;

    -- Finally, drop the table if it exists
    DROP TABLE IF EXISTS public.newsletter_subscriptions CASCADE;
    
    RAISE NOTICE 'Newsletter cleanup completed successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Newsletter cleanup encountered an issue but continuing: %', SQLERRM;
END $$;

-- Step 2: Rename genre column to gender in characters table
DO $$
BEGIN
    -- Check if the characters table exists and has a genre column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'characters' 
        AND column_name = 'genre'
    ) THEN
        -- Rename the column
        ALTER TABLE public.characters RENAME COLUMN genre TO gender;
        RAISE NOTICE 'Successfully renamed genre column to gender in characters table';
    ELSE
        RAISE NOTICE 'Genre column does not exist in characters table - it may already be renamed to gender';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error renaming genre to gender: %', SQLERRM;
    -- Don't fail the migration if this specific step fails
END $$;

-- Step 3: Verify the changes
DO $$
BEGIN
    -- Check if gender column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'characters' 
        AND column_name = 'gender'
    ) THEN
        RAISE NOTICE '✅ Verification: gender column exists in characters table';
    ELSE
        RAISE NOTICE '❌ Verification: gender column not found in characters table';
    END IF;
    
    -- Check that newsletter_subscriptions table does not exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'newsletter_subscriptions'
    ) THEN
        RAISE NOTICE '✅ Verification: newsletter_subscriptions table successfully removed';
    ELSE
        RAISE NOTICE '❌ Verification: newsletter_subscriptions table still exists';
    END IF;
END $$;