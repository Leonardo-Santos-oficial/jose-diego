#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl || !serviceRoleKey) {
    throw new Error(
      'Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para invocar o tick.'
    );
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.rpc('invoke_aviator_tick');

  if (error) {
    throw new Error(`invoke_aviator_tick falhou: ${error.message}`);
  }

  console.log('Tick disparado com sucesso.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
