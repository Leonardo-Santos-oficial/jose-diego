import fs from 'node:fs';
import path from 'node:path';

// Load .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
} catch (e) {
  console.warn('[aviator-tick-dev] Could not load .env.local', e);
}

const baseUrl = process.env.AVIATOR_TICK_URL ?? 'http://localhost:3000/api/aviator/tick';
const secret = process.env.AVIATOR_TICK_SECRET ?? '';
const intervalMs = Number(process.env.AVIATOR_TICK_INTERVAL_MS ?? 700);

console.log(`[aviator-tick-dev] Iniciando loop para ${baseUrl} a cada ${intervalMs}ms`);

async function tickOnce() {
  try {
    const headers = secret
      ? {
          'x-aviator-secret': secret,
        }
      : undefined;

    const response = await fetch(baseUrl, { method: 'POST', headers });
    if (!response.ok) {
      const text = await response.text();
      console.warn('[aviator-tick-dev] Tick respondeu', response.status, text);
    }
  } catch (error) {
    console.error('[aviator-tick-dev] Falha ao disparar tick', error);
  }
}

await tickOnce();
setInterval(tickOnce, intervalMs);
