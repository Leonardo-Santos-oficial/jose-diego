import WebSocket from 'ws';

const url = process.env.WS_URL ?? 'ws://127.0.0.1:8081/ws';
const origin = process.env.WS_ORIGIN ?? 'http://localhost:3000';

const ws = new WebSocket(url, { headers: { Origin: origin } });

const startedAt = Date.now();
let sawError = false;
let sawClose = false;

ws.on('open', () => {
  console.log('[ws] open');
  // Sem auth, o servidor deve responder com erro amigável e depois fechar por timeout.
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
  const text = data.toString();
  console.log('[ws] message', text);
  try {
    const msg = JSON.parse(text);
    if (msg?.type === 'error') {
      sawError = true;
    }
  } catch {
    // ignore
  }
});

ws.on('close', (code, reason) => {
  sawClose = true;
  console.log('[ws] close', code, reason.toString());
  const elapsedMs = Date.now() - startedAt;

  if (!sawError) {
    console.error('[ws] FAIL: expected an error message before close');
    process.exit(1);
  }

  // Esperado: close 4401 após ~5s (auth timeout). Aceita variação.
  if (code !== 4401) {
    console.error(`[ws] FAIL: expected close code 4401, got ${code}`);
    process.exit(1);
  }

  if (elapsedMs < 2000) {
    console.error(`[ws] FAIL: closed too fast (${elapsedMs}ms)`);
    process.exit(1);
  }

  console.log('[ws] PASS');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('[ws] error', err);
  process.exit(1);
});

setTimeout(() => {
  if (!sawClose) {
    console.error('[ws] FAIL: timeout waiting for close');
    try {
      ws.terminate();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}, 10000);
