#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const endpoint = process.env.AVIATOR_TICK_ENDPOINT;
  const intervalMs = Number(process.env.AVIATOR_TICK_FREQUENCY_MS ?? 700);
  const enabled = process.env.AVIATOR_TICK_ENABLED !== '0';
  const secret = process.env.AVIATOR_TICK_SECRET;

  if (!projectUrl || !serviceRoleKey) {
    throw new Error(
      'Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar este script.'
    );
  }

  if (!endpoint) {
    throw new Error(
      'Configure AVIATOR_TICK_ENDPOINT com a URL do endpoint /api/aviator/tick.'
    );
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const headers = secret ? { 'x-aviator-secret': secret } : {};

  const payload = {
    id: true,
    endpoint_url: endpoint,
    headers,
    interval_ms: Number.isFinite(intervalMs) ? intervalMs : 700,
    enabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('aviator_tick_config').upsert(payload);

  if (error) {
    throw new Error(`Falha ao atualizar aviator_tick_config: ${error.message}`);
  }

  console.log('aviator_tick_config atualizada com sucesso', {
    endpoint: payload.endpoint_url,
    intervalMs: payload.interval_ms,
    enabled: payload.enabled,
  });
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
