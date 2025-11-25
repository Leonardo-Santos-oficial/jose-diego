'use server';

import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';

export type EngineStatus = {
  isRunning: boolean;
  isPaused: boolean;
  phase: string;
  currentMultiplier: number;
  roundId: string;
  rtp?: number;
};

export async function getEngineStatus(): Promise<EngineStatus | null> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('engine_state')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const settings = data.settings as Record<string, any>;
  
  return {
    isRunning: true, // The engine service itself is running if we get a response
    isPaused: !!settings?.paused,
    phase: data.phase,
    currentMultiplier: Number(data.current_multiplier),
    roundId: data.current_round_id,
    rtp: settings?.rtp ?? 97.0,
  };
}
