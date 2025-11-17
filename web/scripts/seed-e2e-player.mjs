#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_PLAYER_EMAIL;
  const password = process.env.E2E_PLAYER_PASSWORD;

  if (!projectUrl || !serviceRoleKey) {
    throw new Error(
      'Configure NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY para criar o usuário.'
    );
  }

  if (!email || !password) {
    throw new Error('Defina E2E_PLAYER_EMAIL e E2E_PLAYER_PASSWORD no .env.local.');
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && !error.message?.includes('already registered')) {
    throw new Error(`Falha ao criar usuário E2E: ${error.message}`);
  }

  if (error) {
    console.log(`Usuário ${email} já existia, seguindo.`);
    return;
  }

  console.log('Usuário E2E criado:', data.user?.id);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
