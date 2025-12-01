import type { SupabaseClient } from '@supabase/supabase-js';
import type { UploadResult, UploadConfig } from '../types';
import type { UploadStrategy } from './uploadStrategy';

export class ChatAttachmentUploadStrategy implements UploadStrategy {
  private threadId: string;

  constructor(threadId: string) {
    this.threadId = threadId;
  }

  generatePath(userId: string, fileName: string): string {
    const extension = fileName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const safeFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    return `${this.threadId}/${userId}/${timestamp}-${safeFileName}`;
  }

  async upload(
    client: SupabaseClient,
    config: UploadConfig,
    path: string,
    file: File
  ): Promise<UploadResult> {
    const { data, error } = await client.storage
      .from(config.bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '86400',
      });

    if (error) {
      throw new Error(`Falha no upload do anexo: ${error.message}`);
    }

    const { data: urlData } = client.storage
      .from(config.bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    };
  }
}
