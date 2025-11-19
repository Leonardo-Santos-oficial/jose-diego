# Chat Analytics & Alerting Plan

## 1. Persist new analytics columns
- [ ] Run `supabase migration up` from `web/` so `chat_threads` gains `closed_at`, `closed_by`, `assigned_admin_id`, and `metadata`.
- Verify with `select column_name from information_schema.columns where table_name = 'chat_threads';`.

## 2. Streaming closed threads to BI
1. **Source**: Supabase `chat_threads` table (only `status = 'closed'`).
2. **Transport**: Use Supabase's logical replication or the Edge Function webhook support.
   - Option A: configure a Supabase Function triggered by `postgres_changes` webhooks to push rows into a queue (e.g., Supabase Queue, Kafka, or an HTTP endpoint on the BI pipeline).
   - Option B: Use Supabase's `wal2json` logical replication to replicate `chat_threads` into a warehouse (BigQuery/Snowflake) via a managed connector (e.g., Airbyte/Fivetran).
3. **Schema contract**: send `{ id, user_id, closed_at, closed_by, metadata.notes, metadata.lastAgentName }`.
4. **Retention**: store at least 90 days in the warehouse for SLA dashboards.

## 3. Alerting for new chats (Slack)
1. **Trigger**: `INSERT`/`UPDATE` on `chat_threads` when `status = 'open'` and `assigned_admin_id IS NULL`.
2. **Implementation**:
  - Edge Function `chat-alert-webhook` (see `web/supabase/functions/chat-alert-webhook`) exposta via Webhook do Database.
  - Função lê o payload do `postgres_changes` e publica no Slack usando `SLACK_ALERT_WEBHOOK_URL`.
3. **Rate limiting**: opcional dedupe por `thread_id` em Redis/Supabase KV caso alertas repetidos incomodem.
4. **Slack payload** (exemplo enviado pela função):
   ```json
   {
     "text": "Nova thread aberta pelo usuário {{userId}}",
     "attachments": [
       {
         "title": "Thread",
         "title_link": "https://app.example.com/admin/chat?thread={{threadId}}",
         "fields": [
           {"title": "Notas", "value": metadata.notes ?? 'Sem notas', "short": false}
         ]
       }
     ]
   }
   ```

## 4. Monitoring
- Create dashboard tiles using the new `getChatAnalyticsSnapshot` endpoint as the backing API.
- Add synthetic test hitting `/admin` inbox to ensure realtime subscription stays healthy.
