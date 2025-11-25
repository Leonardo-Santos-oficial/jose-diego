import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoopController } from '../loop/LoopController.js';
import { logger } from '../logger.js';

type AdminCommandRow = {
  id: string;
  action: 'pause' | 'resume' | 'force_crash' | 'set_result';
  payload: Record<string, any>;
  status: string;
};

export class AdminCommandListener {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly controller: LoopController
  ) {}

  start() {
    logger.info('Starting Admin Command Listener...');
    this.supabase
      .channel('admin-commands')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_game_commands',
          filter: 'status=eq.pending',
        },
        (payload) => {
          void this.handleCommand(payload.new as AdminCommandRow);
        }
      )
      .subscribe();
  }

  private async handleCommand(row: AdminCommandRow) {
    logger.info({ id: row.id, action: row.action }, 'Received admin command');

    try {
      switch (row.action) {
        case 'pause':
          this.controller.handle('pause');
          break;
        case 'resume':
          this.controller.handle('resume');
          break;
        case 'force_crash':
          this.controller.handle('forceCrash');
          break;
        case 'set_result':
          // TODO: Implement set result logic in LoopController/GameStateMachine
          logger.warn('set_result not yet implemented');
          break;
        default:
          logger.warn({ action: row.action }, 'Unknown admin command');
      }

      await this.markAsProcessed(row.id);
    } catch (error) {
      logger.error({ error, id: row.id }, 'Failed to process admin command');
      await this.markAsFailed(row.id);
    }
  }

  private async markAsProcessed(id: string) {
    await this.supabase
      .from('admin_game_commands')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', id);
  }

  private async markAsFailed(id: string) {
    await this.supabase
      .from('admin_game_commands')
      .update({ status: 'failed', processed_at: new Date().toISOString() })
      .eq('id', id);
  }
}
