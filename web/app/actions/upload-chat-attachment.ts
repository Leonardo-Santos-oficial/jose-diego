'use server';

import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

export type UploadChatAttachmentResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export async function uploadChatAttachmentAction(formData: FormData): Promise<UploadChatAttachmentResult> {
  try {
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return { success: false, error: 'Nenhum arquivo selecionado.' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não permitido. Use imagens ou PDF.' };
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'Arquivo muito grande. Máximo 10MB.' };
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
    const randomId = Math.random().toString(36).substring(2, 9);
    const path = `${user.id}/${timestamp}-${randomId}.${extension}`;

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: `Falha no upload: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Chat attachment upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload.' 
    };
  }
}
