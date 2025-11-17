'use server';

import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/serverClient';

const payloadSchema = z.object({
  autoCashoutEnabled: z.boolean(),
});

export async function updateAutoCashoutPreferenceAction(input: {
  autoCashoutEnabled: boolean;
}): Promise<{ ok: boolean } | { ok: false; error: string }> {
  'use server';

  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, error: 'Usuário não autenticado.' };
  }

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Formato inválido de preferência.' };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: session.user.id,
      cashout_auto_pref: parsed.data.autoCashoutEnabled,
    });

    if (error) {
      throw error;
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao salvar preferência.';
    console.error('[preferences] erro ao salvar auto cashout', message);
    return { ok: false, error: message };
  }
}
