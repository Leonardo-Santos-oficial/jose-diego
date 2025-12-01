import type { SupabaseClient } from '@supabase/supabase-js';
import type { UploadResult, UploadConfig } from '../types';

export interface UploadStrategy {
  generatePath(userId: string, fileName: string): string;
  upload(
    client: SupabaseClient,
    config: UploadConfig,
    path: string,
    file: File
  ): Promise<UploadResult>;
}
