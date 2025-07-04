/*
  # Add Foreign Key Constraints for Play Relationships

  1. Foreign Key Constraints
    - Add foreign key constraint from characters.play_id to plays.play_id
    - Add foreign key constraint from scenes.play_id to plays.play_id
    - Both with CASCADE delete to maintain referential integrity

  2. Changes
    - Establishes proper relationships for PostgREST nested queries
    - Ensures data consistency between related tables
*/

-- Add foreign key constraint for characters table
ALTER TABLE public.characters
ADD CONSTRAINT fk_characters_play_id
FOREIGN KEY (play_id) REFERENCES public.plays(play_id)
ON DELETE CASCADE;

-- Add foreign key constraint for scenes table
ALTER TABLE public.scenes
ADD CONSTRAINT fk_scenes_play_id
FOREIGN KEY (play_id) REFERENCES public.plays(play_id)
ON DELETE CASCADE;