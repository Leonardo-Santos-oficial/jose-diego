-- Admin-only RPC to purge user conversations and requests.
-- Designed to be called with service_role.

create or replace function public.admin_purge_user_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_global_chat_messages int := 0;
  v_chat_messages int := 0;
  v_chat_threads int := 0;
  v_withdraw_requests int := 0;
  v_bets int := 0;
begin
  delete from public.global_chat_messages where user_id = p_user_id;
  get diagnostics v_global_chat_messages = row_count;

  -- Remove all messages belonging to the user's support threads (including admin replies)
  delete from public.chat_messages
  where thread_id in (
    select id from public.chat_threads where user_id = p_user_id
  );
  get diagnostics v_chat_messages = row_count;

  delete from public.chat_threads where user_id = p_user_id;
  get diagnostics v_chat_threads = row_count;

  delete from public.withdraw_requests where user_id = p_user_id;
  get diagnostics v_withdraw_requests = row_count;

  delete from public.bets where user_id = p_user_id;
  get diagnostics v_bets = row_count;

  return jsonb_build_object(
    'user_id', p_user_id,
    'deleted', jsonb_build_object(
      'global_chat_messages', v_global_chat_messages,
      'chat_messages', v_chat_messages,
      'chat_threads', v_chat_threads,
      'withdraw_requests', v_withdraw_requests,
      'bets', v_bets
    )
  );
end;
$$;

revoke all on function public.admin_purge_user_data(uuid) from public;
grant execute on function public.admin_purge_user_data(uuid) to service_role;
