type DenoServeHandler = (req: Request) => Response | Promise<Response>;

declare const Deno: {
  env: { get: (name: string) => string | undefined };
  serve: (handler: DenoServeHandler) => void;
};
type PostgresWebhookEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record?: ChatThreadRecord;
  old_record?: ChatThreadRecord | null;
};

type ChatThreadRecord = {
  id: string;
  user_id: string;
  status: string;
  assigned_admin_id: string | null;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const slackWebhookUrl = Deno.env.get('SLACK_ALERT_WEBHOOK_URL');

if (!slackWebhookUrl) {
  console.warn('SLACK_ALERT_WEBHOOK_URL is not configured; alerts will be dropped.');
}

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const buildSlackPayload = (record: ChatThreadRecord) => {
  const notes =
    typeof record.metadata === 'object' && record.metadata !== null
      ? String(record.metadata['notes'] ?? 'Sem notas')
      : 'Sem notas';

  return {
    text: `Nova thread aberta pelo usuário ${record.user_id}`,
    attachments: [
      {
        color: '#ffcc00',
        title: 'Abrir thread',
        title_link: `https://app.example.com/admin/chat?thread=${record.id}`,
        fields: [
          { title: 'Thread ID', value: record.id, short: true },
          { title: 'Usuário', value: record.user_id, short: true },
          { title: 'Notas', value: notes, short: false },
        ],
      },
    ],
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  let event: PostgresWebhookEvent;
  try {
    event = await req.json();
  } catch (error) {
    console.error('chat-alert-webhook: invalid JSON payload', error);
    return respond(400, { error: 'Invalid JSON payload' });
  }

  if (event.table !== 'chat_threads' || event.schema !== 'public') {
    return respond(200, { skipped: 'Irrelevant table' });
  }

  if (!event.record || (event.type !== 'INSERT' && event.type !== 'UPDATE')) {
    return respond(200, { skipped: 'No actionable record' });
  }

  const record = event.record;
  const threadIsUnassigned = !record.assigned_admin_id;
  const threadIsOpen = record.status === 'open';

  if (!threadIsOpen || !threadIsUnassigned) {
    return respond(200, { skipped: 'Thread already assigned or closed' });
  }

  if (!slackWebhookUrl) {
    return respond(500, { error: 'Slack webhook not configured' });
  }

  const payload = buildSlackPayload(record);

  try {
    const webhookResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      console.error(
        'chat-alert-webhook: Slack webhook failed',
        await webhookResponse.text()
      );
      return respond(502, { error: 'Slack webhook failed' });
    }
  } catch (error) {
    console.error('chat-alert-webhook: Slack webhook error', error);
    return respond(502, { error: 'Slack webhook error' });
  }

  return respond(200, { dispatched: true });
});
