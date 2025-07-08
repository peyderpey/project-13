/*
  # Remove custom users table and use auth.users metadata

  (Removed all public.users table logic. Only grants for other tables and helper functions for user role management remain.)
*/

-- Step 4: Ensure proper permissions (these should already exist)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plays TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rehearsal_sessions TO authenticated;

-- Step 5: Create helper function for user role management
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data 
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to check if user is demo admin
CREATE OR REPLACE FUNCTION is_demo_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(raw_user_meta_data->>'is_demo_admin', 'false')::boolean
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_demo_admin(uuid) TO authenticated; 