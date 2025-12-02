import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceClient } from '../clients/supabaseClient.js';
import { logger } from '../logger.js';

export interface EngineStateService {
  updatePausedState(paused: boolean): Promise<void>;
  updateRtp(rtp: number): Promise<void>;
  setNextCrashTarget(multiplier: number): Promise<void>;
  clearNextCrashTarget(): Promise<void>;
  getSettings(): Promise<EngineSettings | null>;
}

export interface EngineSettings {
  paused: boolean;
  rtp: number;
  nextCrashTarget?: number;
  minCrashMultiplier?: number;
  maxCrashMultiplier?: number;
}

export class SupabaseEngineStateService implements EngineStateService {
  constructor(private readonly supabase: SupabaseClient = supabaseServiceClient) {}

  async updatePausedState(paused: boolean): Promise<void> {
    const settings = await this.getSettings();
    const newSettings = { ...settings, paused };
    
    const { error } = await this.supabase
      .from('engine_state')
      .update({ 
        settings: newSettings,
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null); // Update all rows (should be only one)

    if (error) {
      logger.error({ error, paused }, 'Failed to update paused state');
    } else {
      logger.info({ paused }, 'Engine paused state updated');
    }
  }

  async updateRtp(rtp: number): Promise<void> {
    const settings = await this.getSettings();
    const newSettings = { ...settings, rtp };
    
    const { error } = await this.supabase
      .from('engine_state')
      .update({ 
        settings: newSettings,
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (error) {
      logger.error({ error, rtp }, 'Failed to update RTP');
    } else {
      logger.info({ rtp }, 'RTP updated');
    }
  }

  async setNextCrashTarget(multiplier: number): Promise<void> {
    const settings = await this.getSettings();
    const newSettings = { ...settings, nextCrashTarget: multiplier };
    
    const { error } = await this.supabase
      .from('engine_state')
      .update({ 
        settings: newSettings,
        target_multiplier: multiplier,
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (error) {
      logger.error({ error, multiplier }, 'Failed to set next crash target');
    } else {
      logger.info({ multiplier }, 'Next crash target set');
    }
  }

  async clearNextCrashTarget(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings) return;
    
    // Remove nextCrashTarget from settings object
    const { nextCrashTarget: _, ...settingsWithoutTarget } = settings as any;
    
    const { error } = await this.supabase
      .from('engine_state')
      .update({ 
        settings: settingsWithoutTarget,
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (error) {
      logger.error({ error }, 'Failed to clear next crash target');
    } else {
      logger.info('Next crash target cleared from database');
    }
  }

  async getSettings(): Promise<EngineSettings | null> {
    const { data, error } = await this.supabase
      .from('engine_state')
      .select('settings')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { paused: false, rtp: 97 };
    }

    return data.settings as EngineSettings;
  }
}
