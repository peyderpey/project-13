/*
  # Fix infinite recursion in users table policies

  (Removed all public.users table policy and trigger logic. Only grants for other tables remain.)
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plays TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rehearsal_sessions TO authenticated; 