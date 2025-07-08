-- Fix existing plays that have no characters or scenes
-- This migration will reprocess script content for plays that were uploaded before proper parsing

-- First, let's see what we're working with
DO $$
DECLARE
    play_record RECORD;
    script_content TEXT;
    title TEXT;
    play_id UUID;
BEGIN
    -- Find plays that have no characters or scenes
    FOR play_record IN 
        SELECT p.play_id, p.title, p.script_content, p.user_id
        FROM plays p
        LEFT JOIN characters c ON p.play_id = c.play_id
        LEFT JOIN scenes s ON p.play_id = s.play_id
        WHERE c.character_id IS NULL AND s.scene_id IS NULL
        AND p.script_content IS NOT NULL
        AND LENGTH(p.script_content) > 100  -- Only process plays with substantial content
    LOOP
        RAISE NOTICE 'Processing play: % (ID: %)', play_record.title, play_record.play_id;
        
        -- For now, we'll just log the issue
        -- The actual reprocessing will need to be done through the application
        -- since we need the JavaScript parsing logic
        
        RAISE NOTICE 'Play "%" needs reprocessing. Content length: % characters', 
            play_record.title, LENGTH(play_record.script_content);
    END LOOP;
END $$;

-- Add a column to track if a play needs reprocessing
ALTER TABLE plays ADD COLUMN IF NOT EXISTS needs_reprocessing BOOLEAN DEFAULT FALSE;

-- Mark plays that need reprocessing
UPDATE plays 
SET needs_reprocessing = TRUE
WHERE play_id IN (
    SELECT p.play_id
    FROM plays p
    LEFT JOIN characters c ON p.play_id = c.play_id
    LEFT JOIN scenes s ON p.play_id = s.play_id
    WHERE c.character_id IS NULL AND s.scene_id IS NULL
    AND p.script_content IS NOT NULL
    AND LENGTH(p.script_content) > 100
);

-- Create a function to help with reprocessing
CREATE OR REPLACE FUNCTION mark_play_processed(play_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE plays 
    SET needs_reprocessing = FALSE
    WHERE play_id = play_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_play_processed(UUID) TO authenticated; 