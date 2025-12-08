import { createClient } from './client';

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data, error };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { profile } = await getUserProfile(userId);
  return profile?.user_roles === 'admin';
}

export async function redirectBasedOnRole() {
  const { user } = await getCurrentUser();
  if (!user) return '/auth/login';
  
  const admin = await isAdmin(user.id);
  return admin ? '/admin/complaints' : '/';
}

export async function uploadImage(bucket: string, path: string, file: File) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  
  if (error) return { publicUrl: null, error };
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return { publicUrl, error: null };
}
