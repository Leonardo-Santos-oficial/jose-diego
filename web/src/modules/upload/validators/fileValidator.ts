import type { FileValidationResult, UploadConfig } from '../types';

export interface FileValidator {
  validate(file: File, config: UploadConfig): FileValidationResult;
}

export class DefaultFileValidator implements FileValidator {
  validate(file: File, config: UploadConfig): FileValidationResult {
    if (file.size > config.maxSizeBytes) {
      const maxMB = config.maxSizeBytes / (1024 * 1024);
      return {
        valid: false,
        error: `O arquivo excede o tamanho máximo de ${maxMB}MB.`,
      };
    }

    if (!config.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Use: ${config.allowedMimeTypes.join(', ')}.`,
      };
    }

    return { valid: true };
  }
}
