import type { SupabaseClient } from '@supabase/supabase-js';
import type { UploadResult, UploadConfig } from '../types';
import type { UploadStrategy } from './uploadStrategy';

export class AvatarUploadStrategy implements UploadStrategy {
  generatePath(userId: string, fileName: string): string {
    const extension = fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    return `${userId}/avatar-${timestamp}.${extension}`;
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
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      throw new Error(`Falha no upload do avatar: ${error.message}`);
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
