import { supabase } from "./supabase";

export async function getUserUuid(privyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', privyId)
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error fetching user UUID:', error);
    return null;
  }
}
