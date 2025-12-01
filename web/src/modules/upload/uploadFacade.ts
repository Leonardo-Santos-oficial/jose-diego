import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UploadDestination,
  UploadResult,
  FileValidationResult,
  AttachmentType,
} from './types';
import { UPLOAD_CONFIGS } from './types';
import { DefaultFileValidator, type FileValidator } from './validators/fileValidator';
import type { UploadStrategy } from './strategies/uploadStrategy';
import { AvatarUploadStrategy } from './strategies/avatarUploadStrategy';
import { ChatAttachmentUploadStrategy } from './strategies/chatAttachmentUploadStrategy';

export interface UploadFacadeOptions {
  threadId?: string;
}

export class UploadFacade {
  private readonly validator: FileValidator;

  constructor(validator?: FileValidator) {
    this.validator = validator ?? new DefaultFileValidator();
  }

  validateFile(
    file: File,
    destination: UploadDestination
  ): FileValidationResult {
    const config = UPLOAD_CONFIGS[destination];
    return this.validator.validate(file, config);
  }

  async uploadFile(
    client: SupabaseClient,
    file: File,
    userId: string,
    destination: UploadDestination,
    options?: UploadFacadeOptions
  ): Promise<UploadResult> {
    const config = UPLOAD_CONFIGS[destination];

    const validation = this.validateFile(file, destination);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const strategy = this.createStrategy(destination, options);
    const path = strategy.generatePath(userId, file.name);

    return strategy.upload(client, config, path, file);
  }

  getAttachmentType(contentType: string): AttachmentType {
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    return 'document';
  }

  private createStrategy(
    destination: UploadDestination,
    options?: UploadFacadeOptions
  ): UploadStrategy {
    switch (destination) {
      case 'avatar':
        return new AvatarUploadStrategy();
      case 'chat-attachment':
        if (!options?.threadId) {
          throw new Error('threadId é obrigatório para anexos de chat.');
        }
        return new ChatAttachmentUploadStrategy(options.threadId);
    }
  }
}

export const uploadFacade = new UploadFacade();
