import type { UserDataPurgeRepository, UserDataPurgeResult } from '../types';
import { PurgeUserDataCommand } from '../commands/PurgeUserDataCommand';
import { SupabaseUserDataPurgeRepository } from '../repositories/SupabaseUserDataPurgeRepository';

export class UserDataPurgeService {
  private readonly repository: UserDataPurgeRepository;
  private readonly command: PurgeUserDataCommand;

  constructor(repository?: UserDataPurgeRepository) {
    this.repository = repository ?? new SupabaseUserDataPurgeRepository();
    this.command = new PurgeUserDataCommand(this.repository);
  }

  purgeUserData(userId: string): Promise<UserDataPurgeResult> {
    return this.command.execute(userId);
  }
}
