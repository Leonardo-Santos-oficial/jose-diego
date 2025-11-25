'use server';

import { getSupabaseServiceRoleClient } from '@/lib/supabase/serviceRoleClient';
import { revalidatePath } from 'next/cache';

type GameAction = 'pause' | 'resume' | 'force_crash' | 'set_result' | 'update_settings';

export async function sendGameCommand(action: GameAction, payload?: any) {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.from('admin_game_commands').insert({
    action,
    payload,
    status: 'pending',
  });

  if (error) {
    console.error('Failed to send game command:', error);
    return { success: false, message: 'Falha ao enviar comando.' };
  }

  revalidatePath('/admin/game');
  return { success: true, message: 'Comando enviado com sucesso.' };
}
