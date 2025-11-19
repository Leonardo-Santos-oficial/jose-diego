# chat-alert-webhook

Edge Function responsável por mandar alertas no Slack quando um `chat_thread` é criado (ou atualizado) sem `assigned_admin_id` e com `status = 'open'`.

## Variáveis de ambiente

| Nome | Descrição |
| --- | --- |
| `SLACK_ALERT_WEBHOOK_URL` | Webhook do Slack usado para enviar a mensagem do alerta. |

Adicione o valor no projeto Supabase com:

```bash
supabase secrets set SLACK_ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

## Deploy

```bash
cd web
supabase functions deploy chat-alert-webhook --project-ref <project-ref>
```

## Ligando no gatilho do banco

1. Acesse o painel Supabase → Database → Webhooks.
2. Crie um webhook `chat-alert-webhook` apontando para o endpoint público da função.
3. Configure o evento `INSERT` e `UPDATE` em `public.chat_threads`.
4. Publique e teste com `supabase functions invoke chat-alert-webhook --body '{"type":"INSERT","schema":"public","table":"chat_threads","record":{"id":"thread-1","user_id":"user-1","status":"open","assigned_admin_id":null}}'`.
