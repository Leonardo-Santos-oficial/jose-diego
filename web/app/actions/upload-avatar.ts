'use server';

import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export type UploadAvatarResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadAvatarAction(formData: FormData): Promise<UploadAvatarResult> {
  try {
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return { success: false, error: 'Nenhum arquivo selecionado.' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.' };
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 2MB.' };
    }

    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `${user.id}/avatar-${timestamp}.${extension}`;

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: `Falha no upload: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload.' 
    };
  }
}
