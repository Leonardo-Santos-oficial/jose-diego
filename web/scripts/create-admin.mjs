import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Carregar .env.local explicitamente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TARGET_EMAIL = 'flipd3als@gmail.com';
const TARGET_PASSWORD = 'panda123456@';

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl || !serviceRoleKey) {
    console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local');
    process.exit(1);
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`Verificando usuário: ${TARGET_EMAIL}...`);

  // 1. Listar usuários para encontrar o ID (se existir)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

  if (existingUser) {
    console.log(`Usuário encontrado (ID: ${existingUser.id}). Atualizando senha e permissões...`);
    
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: TARGET_PASSWORD,
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' },
      email_confirm: true
    });

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      process.exit(1);
    }
    
    console.log('Usuário atualizado com sucesso!');
    console.log('Role (user_metadata):', data.user.user_metadata.role);
    console.log('Role (app_metadata):', data.user.app_metadata.role);

  } else {
    console.log('Usuário não encontrado. Criando novo admin...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' }
    });

    if (error) {
      console.error('Erro ao criar usuário:', error);
      process.exit(1);
    }

    console.log('Usuário criado com sucesso!');
    console.log('ID:', data.user.id);
    console.log('Role:', data.user.user_metadata.role);
  }
}

main().catch(err => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
