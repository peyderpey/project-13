-- Create user_permissions table for secure, admin-controlled user roles
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_demo_admin boolean NOT NULL DEFAULT false,
  is_pro_member boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_user_permissions_updated_at();

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own permissions
CREATE POLICY "Users can read their own permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins (service_role) to read all permissions
CREATE POLICY "Admins can read all permissions" ON public.user_permissions
  FOR SELECT TO service_role
  USING (true);

-- Allow admins (service_role) to insert, update, and delete all permissions
CREATE POLICY "Admins can insert all permissions" ON public.user_permissions
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can update all permissions" ON public.user_permissions
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete all permissions" ON public.user_permissions
  FOR DELETE TO service_role
  USING (true); 