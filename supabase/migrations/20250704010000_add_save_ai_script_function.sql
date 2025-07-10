-- Function to save a script processed by AI
-- This function handles inserting data into multiple tables in a single transaction.
CREATE OR REPLACE FUNCTION public.save_ai_assisted_script(
    user_id_in uuid,
    gemini_response_in jsonb
)
RETURNS uuid -- Returns the new play_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_play_id uuid;
    new_analysis_id uuid;
    char_record jsonb;
    scene_record jsonb;
    line_record jsonb;
    new_character_id uuid;
    scene_content_text text;
BEGIN
    -- 1. Insert into the 'plays' table
    INSERT INTO public.plays (user_id, title, author, language, file_type)
    VALUES (
        user_id_in,
        gemini_response_in->'script'->>'title',
        gemini_response_in->'script'->>'author',
        gemini_response_in->'script'->>'language',
        'AI Assisted'
    )
    RETURNING play_id INTO new_play_id;

    -- 2. Insert into 'ai_script_analysis'
    INSERT INTO public.ai_script_analysis (play_id, user_id, script_summary, character_analysis, scene_by_scene_analysis, raw_ai_response)
    VALUES (
        new_play_id,
        user_id_in,
        gemini_response_in->'script'->'summary',
        gemini_response_in->'characters',
        gemini_response_in->'script'->'scenes',
        gemini_response_in
    )
    RETURNING analysis_id INTO new_analysis_id;

    -- 3. Link the analysis_id back to the plays table
    UPDATE public.plays
    SET analysis_id = new_analysis_id
    WHERE play_id = new_play_id;

    -- 4. Insert characters and their voice profiles
    FOR char_record IN SELECT * FROM jsonb_array_elements(gemini_response_in->'characters')
    LOOP
        -- Insert into 'characters' table
        INSERT INTO public.characters (play_id, character_name, gender, age_group, line_count)
        VALUES (
            new_play_id,
            char_record->>'name',
            char_record->'analysis'->>'gender',
            char_record->'analysis'->>'age_group',
            (
                SELECT COUNT(*)
                FROM jsonb_array_elements(gemini_response_in->'script'->'scenes') s,
                     jsonb_array_elements(s->'lines') l
                WHERE l->>'character' = char_record->>'name'
            )
        )
        RETURNING character_id INTO new_character_id;

        -- Insert into 'character_voice_profiles'
        INSERT INTO public.character_voice_profiles (character_id, play_id, voice_description, gender, age_group, ssml_template, gemini_tts_prompt, recommended_google_voice)
        VALUES (
            new_character_id,
            new_play_id,
            char_record->'voice_profile'->>'google_voice_recommendation',
            char_record->'analysis'->>'gender',
            char_record->'analysis'->>'age_group',
            char_record->'voice_profile'->>'ssml_template',
            char_record->'voice_profile'->>'gemini_tts_prompt',
            char_record->'voice_profile'->'google_voice_recommendation'
        );
    END LOOP;

    -- 5. Insert scenes (and their content based on lines)
    FOR scene_record IN SELECT * FROM jsonb_array_elements(gemini_response_in->'script'->'scenes')
    LOOP
        -- Aggregate lines into a single text block for scene_content, mimicking existing app logic
        SELECT string_agg(
                   (line->>'character') || ': ' || (line->>'dialogue'),
                   E'
'
               )
        INTO scene_content_text
        FROM jsonb_array_elements(scene_record->'lines') as line;

        INSERT INTO public.scenes (play_id, scene_number, act_number, setting, scene_content)
        VALUES (
            new_play_id,
            (scene_record->>'scene_number')::integer,
            (scene_record->>'act_number')::integer,
            scene_record->>'setting',
            scene_content_text
        );
    END LOOP;

    RETURN new_play_id;
END;
$$;
