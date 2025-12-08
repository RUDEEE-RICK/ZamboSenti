import { createClient } from '@/lib/supabase/client';

/**
 * Check if the current user is authenticated and has admin privileges
 * @returns Object with user, isAdmin flag, and error if any
 */
export async function checkAdminAuth() {
  const supabase = createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, isAdmin: false, error: 'Not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_roles')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_roles !== 'admin') {
      return { user, isAdmin: false, error: 'Access denied. Admin privileges required.' };
    }

    return { user, isAdmin: true, error: null };
  } catch {
    return { user: null, isAdmin: false, error: 'Failed to verify authentication' };
  }
}

/**
 * Check if user is authenticated
 * @returns Object with user and error if any
 */
export async function checkAuth() {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'Not authenticated' };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: 'Authentication check failed' };
  }
}

/**
 * Get current user's profile
 * @param userId User ID to fetch profile for
 * @returns User profile or null
 */
export async function getUserProfileData(userId: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { profile: data, error: null };
  } catch (err) {
    return { profile: null, error: err instanceof Error ? err.message : 'Failed to fetch profile' };
  }
}
