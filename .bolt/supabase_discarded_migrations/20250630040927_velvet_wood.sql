/*
  # Fix typo: Rename 'genre' column to 'gender' in characters table

  1. Schema Update
    - Rename `genre` column to `gender` in the `characters` table
    - This corrects a typo in the original schema

  2. Changes
    - Column name change only - no data type or constraint changes
    - Maintains all existing data and relationships
*/

-- Rename the 'genre' column to 'gender' in the characters table
ALTER TABLE public.characters
RENAME COLUMN genre TO gender;