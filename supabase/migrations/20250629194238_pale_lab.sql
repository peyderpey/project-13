/*
  # Add voice settings to characters table

  1. Changes
    - Add `voice_settings` column to `characters` table to store voice configuration
    - Column will store rate, pitch, volume, and voiceIndex as JSONB

  2. Security
    - No RLS changes needed as existing policies already cover this table
*/

-- Add voice_settings column to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS voice_settings jsonb DEFAULT '{"rate": 1.0, "pitch": 1.0, "volume": 1.0, "voiceIndex": 0}'::jsonb;

-- Add index for voice_settings queries
CREATE INDEX IF NOT EXISTS characters_voice_settings_idx ON characters USING gin (voice_settings);