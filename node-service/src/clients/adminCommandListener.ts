import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoopController } from '../loop/LoopController.js';
import type { EngineStateService } from '../services/engineStateService.js';
import type { GameStateMachine } from '../loop/GameStateMachine.js';
import { logger } from '../logger.js';

type AdminCommandRow = {
  id: string;
  action: 'pause' | 'resume' | 'force_crash' | 'set_result' | 'update_settings';
  payload: Record<string, any>;
  status: string;
};

export class AdminCommandListener {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly controller: LoopController,
    private readonly engineStateService: EngineStateService,
    private readonly machine: GameStateMachine
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
    logger.info({ id: row.id, action: row.action, payload: row.payload }, 'Received admin command');

    try {
      switch (row.action) {
        case 'pause':
          this.controller.handle('pause');
          await this.engineStateService.updatePausedState(true);
          break;
        case 'resume':
          this.controller.handle('resume');
          await this.engineStateService.updatePausedState(false);
          break;
        case 'force_crash':
          this.controller.handle('forceCrash');
          break;
        case 'set_result':
          if (row.payload?.value && typeof row.payload.value === 'number') {
            await this.engineStateService.setNextCrashTarget(row.payload.value);
            this.machine.setNextCrashTarget(row.payload.value);
            logger.info({ value: row.payload.value }, 'Next crash target set');
          }
          break;
        case 'update_settings':
          if (row.payload?.rtp && typeof row.payload.rtp === 'number') {
            await this.engineStateService.updateRtp(row.payload.rtp);
            this.machine.setRtp(row.payload.rtp); // Update RTP in the game machine
            logger.info({ rtp: row.payload.rtp }, 'RTP updated in engine');
          }
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
