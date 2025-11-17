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

  const listResponse = await supabase.auth.admin.listUsers();
  if (listResponse.error) {
    throw new Error(`Falha ao listar usuários: ${listResponse.error.message}`);
  }

  const existingUser = listResponse.data?.users?.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Falha ao criar usuário E2E: ${error.message}`);
    }

    console.log('Usuário E2E criado:', data.user?.id ?? 'sem id retornado');
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    existingUser.id,
    {
      password,
      email_confirm: true,
    }
  );

  if (updateError) {
    throw new Error(`Falha ao atualizar usuário E2E: ${updateError.message}`);
  }

  console.log('Usuário E2E atualizado:', existingUser.id);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
