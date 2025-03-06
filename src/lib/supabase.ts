import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true
    }
  }
)

export async function checkUserRegistered(userId: string, email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('auth_id')
      .eq('auth_id', userId)
      // .eq('email', email)

    if (error) {
      console.log('Error checking user registration:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      return true;
    } 
    return false;
    
  } catch (error) {
    console.log('Error checking user registration:', error);
    return false;
  }
}

export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', userId)
    .single();

  if (error || !data) {
    return false;
  }
  return true;
};