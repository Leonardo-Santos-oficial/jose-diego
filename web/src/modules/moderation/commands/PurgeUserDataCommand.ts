import type { UserDataPurgeRepository, UserDataPurgeResult } from '../types';

export class PurgeUserDataCommand {
  constructor(private readonly repository: UserDataPurgeRepository) {}

  async execute(userId: string): Promise<UserDataPurgeResult> {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new Error('ID do usuário é obrigatório.');
    }

    return this.repository.purgeUserData(normalizedUserId);
  }
}
