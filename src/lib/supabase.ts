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

export async function checkUserRegistered(userId: string): Promise<boolean> {
  try {
    const data = await supabase
      .from('users')
      .select('auth_id')
      .eq('auth_id', userId)
  
    // if (error) {
    //   console.log('Error checking user registration:', error);
    //   return false;
    // }
    // console.log('Data:', data);
    if (data.data && data.data.length > 0) {
      return true;
    } 
    return false;
    
  } catch (error) {
    return false;
  }
}