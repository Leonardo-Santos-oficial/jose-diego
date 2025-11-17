import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, test } from 'vitest';

loadEnv({ path: '.env.local', override: false });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_TEST_USER_ID',
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
const describeIfReady = missingEnvVars.length > 0 ? describe.skip : describe;
const supabase: SupabaseClient | null =
  missingEnvVars.length === 0
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

async function resetWallet(client: SupabaseClient, userId: string, balance: number) {
  await client
    .from('wallets')
    .upsert({ user_id: userId, balance, updated_at: new Date().toISOString() });
}

async function cleanupBets(client: SupabaseClient, userId: string) {
  await client.from('bets').delete().eq('user_id', userId);
}

async function createRound(client: SupabaseClient) {
  const { data, error } = await client
    .from('game_rounds')
    .insert({ status: 'awaitingBets' })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar rodada: ${error?.message}`);
  }

  return data.id;
}

function extractMessage(error: { message?: string; details?: string } | null) {
  return error?.message ?? error?.details ?? '';
}

describeIfReady('Integração Supabase das RPCs do Aviator', () => {
  const userId = process.env.SUPABASE_TEST_USER_ID as string;
  let roundId: string;

  beforeEach(async () => {
    await cleanupBets(supabase!, userId);
    roundId = await createRound(supabase!);
    await resetWallet(supabase!, userId, 1000);
  });

  test('perform_bet debita o saldo e gera ticket', async () => {
    const { data, error } = await supabase!.rpc('perform_bet', {
      p_round_id: roundId,
      p_user_id: userId,
      p_amount: 50,
      p_autocashout: null,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(Number(data?.[0]?.balance)).toBeCloseTo(950, 2);
    expect(data?.[0]?.ticket_id).toBeDefined();
  });

  test('perform_bet retorna INSUFFICIENT_FUNDS quando o saldo é menor que a aposta', async () => {
    await resetWallet(supabase!, userId, 10);

    const { error } = await supabase!.rpc('perform_bet', {
      p_round_id: roundId,
      p_user_id: userId,
      p_amount: 50,
      p_autocashout: null,
    });

    expect(error).not.toBeNull();
    expect(extractMessage(error)).toContain('INSUFFICIENT_FUNDS');
  });

  test('perform_cashout credita apenas uma vez', async () => {
    const bet = await supabase!.rpc('perform_bet', {
      p_round_id: roundId,
      p_user_id: userId,
      p_amount: 40,
      p_autocashout: null,
    });

    const ticketId = bet.data?.[0]?.ticket_id;
    expect(ticketId).toBeDefined();

    const cashoutSuccess = await supabase!.rpc('perform_cashout', {
      p_ticket_id: ticketId,
      p_user_id: userId,
      p_round_id: roundId,
      p_multiplier: 2,
    });

    expect(cashoutSuccess.error).toBeNull();
    expect(Number(cashoutSuccess.data?.[0]?.balance)).toBeGreaterThan(1000);

    const cashoutRepeat = await supabase!.rpc('perform_cashout', {
      p_ticket_id: ticketId,
      p_user_id: userId,
      p_round_id: roundId,
      p_multiplier: 1.2,
    });

    expect(cashoutRepeat.error).not.toBeNull();
    expect(extractMessage(cashoutRepeat.error)).toContain('BET_ALREADY_CASHED');
  });
});

if (missingEnvVars.length > 0) {
  describe.skip('Integração Supabase das RPCs do Aviator (configuração ausente)', () => {
    test.skip(`Defina as variáveis ${missingEnvVars.join(', ')}`, () => {});
  });
}
