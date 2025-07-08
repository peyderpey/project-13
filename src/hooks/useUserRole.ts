import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPermissions {
  is_demo_admin: boolean;
  is_pro_member: boolean;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPermissions(null);
      return;
    }
    setLoading(true);
    supabase
      .from('user_permissions')
      .select('is_demo_admin, is_pro_member')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setPermissions({ is_demo_admin: false, is_pro_member: false });
        } else {
          setPermissions({
            is_demo_admin: data.is_demo_admin,
            is_pro_member: data.is_pro_member,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const isDemoAdmin = () => permissions?.is_demo_admin === true;
  const isProMember = () => permissions?.is_pro_member === true;

  // Demo admin: no limits, full access
  // Pro member: full access, but with certain limits (enforced in app logic)
  const canAccessAIFeatures = () => isDemoAdmin() || isProMember();

  return {
    permissions,
    loading,
    isDemoAdmin,
    isProMember,
    canAccessAIFeatures,
  };
};