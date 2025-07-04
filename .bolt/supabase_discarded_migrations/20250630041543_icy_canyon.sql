/*
  # Rename genre column to gender in characters table

  1. Changes
    - Rename the 'genre' column to 'gender' in the characters table
    - This corrects a naming issue where the column was misnamed as 'genre'

  2. Verification
    - Verify the column rename was successful
*/

-- Rename the 'genre' column to 'gender' in the characters table
ALTER TABLE public.characters
RENAME COLUMN genre TO gender;

-- Verify the change was successful
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'characters' 
        AND column_name = 'gender'
    ) THEN
        RAISE NOTICE '✅ Successfully renamed genre column to gender in characters table';
    ELSE
        RAISE NOTICE '❌ Failed to rename genre column to gender in characters table';
    END IF;
END $$;