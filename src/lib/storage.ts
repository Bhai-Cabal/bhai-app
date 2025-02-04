// utils/storage.ts
//test

import { supabase } from '@/lib/supabase';

export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return fileName;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

export async function deleteProfilePicture(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function getProfilePictureUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);
  
  return publicUrl;
}