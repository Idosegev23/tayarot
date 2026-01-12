'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadGeneratedImage(
  imageData: string,
  mimeType: string,
  fileName: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Determine file extension from mime type
    const ext = mimeType.split('/')[1] || 'png';
    const fullFileName = `${fileName}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('agent-mary')
      .upload(`generated/${fullFileName}`, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.path) {
      return { success: false, error: 'No path returned from upload' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('agent-mary')
      .getPublicUrl(data.path);

    return {
      success: true,
      path: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to upload image' 
    };
  }
}
