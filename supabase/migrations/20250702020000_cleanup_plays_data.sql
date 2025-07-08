-- Clean up all plays data while preserving user information
-- This will allow users to re-upload their scripts with proper parsing

-- Delete all scenes first (due to foreign key constraints)
DELETE FROM scenes;

-- Delete all characters
DELETE FROM characters;

-- Delete all plays
DELETE FROM plays;

-- Reset any sequences if they exist
-- Note: UUID columns don't use sequences, but this is good practice
-- ALTER SEQUENCE IF EXISTS plays_play_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS characters_character_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS scenes_scene_id_seq RESTART WITH 1;

-- Clean up rehearsal sessions that reference deleted plays
DELETE FROM rehearsal_sessions;

-- Verify cleanup
DO $$
DECLARE
    plays_count INTEGER;
    characters_count INTEGER;
    scenes_count INTEGER;
    rehearsal_sessions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plays_count FROM plays;
    SELECT COUNT(*) INTO characters_count FROM characters;
    SELECT COUNT(*) INTO scenes_count FROM scenes;
    SELECT COUNT(*) INTO rehearsal_sessions_count FROM rehearsal_sessions;
    
    RAISE NOTICE 'Cleanup completed:';
    RAISE NOTICE '- Plays remaining: %', plays_count;
    RAISE NOTICE '- Characters remaining: %', characters_count;
    RAISE NOTICE '- Scenes remaining: %', scenes_count;
    RAISE NOTICE '- Rehearsal sessions remaining: %', rehearsal_sessions_count;
    
    -- Verify user data is preserved
    RAISE NOTICE 'User data preserved - user_permissions and auth.users remain intact';
END $$; 