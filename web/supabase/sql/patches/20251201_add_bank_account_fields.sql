-- Add bank account fields for alternative withdrawal method
alter table if exists public.user_profiles
  add column if not exists bank_name text,
  add column if not exists bank_agency text,
  add column if not exists bank_account text,
  add column if not exists bank_account_type text,
  add column if not exists bank_holder_name text,
  add column if not exists bank_holder_cpf text,
  add column if not exists preferred_withdraw_method text default 'pix';

comment on column public.user_profiles.bank_name is 'Nome do banco (ex: Nubank, Itaú)';
comment on column public.user_profiles.bank_agency is 'Número da agência sem dígito';
comment on column public.user_profiles.bank_account is 'Número da conta com dígito';
comment on column public.user_profiles.bank_account_type is 'Tipo: corrente ou poupanca';
comment on column public.user_profiles.bank_holder_name is 'Nome do titular da conta';
comment on column public.user_profiles.bank_holder_cpf is 'CPF do titular';
comment on column public.user_profiles.preferred_withdraw_method is 'Método preferido: pix ou bank';
