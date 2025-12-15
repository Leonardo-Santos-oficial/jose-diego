import type { IncomingMessage } from 'node:http';
import { WebSocketServer } from 'ws';
import type { FastifyInstance } from 'fastify';

import { allowedOrigins } from '../config/env.js';
import { logger } from '../logger.js';
import { resolveUserIdFromAccessToken } from './auth.js';
import type { WsClientMessage, WsServerMessage } from './types.js';
import { WsHub } from './WsHub.js';

export type WsServerDeps = {
  hub: WsHub;
};

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function isAuthMessage(value: unknown): value is Extract<WsClientMessage, { type: 'auth' }> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).type === 'auth' &&
    typeof (value as any).token === 'string'
  );
}

export function attachWebSocketServer(app: FastifyInstance, deps: WsServerDeps): void {
  const wss = new WebSocketServer({ noServer: true });

  app.server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      socket.destroy();
      return;
    }

    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    let authenticatedUserId: string | null = null;

    const authTimeout = setTimeout(() => {
      if (!authenticatedUserId) {
        ws.close(4401, 'Unauthorized');
      }
    }, 5000);

    ws.on('message', async (data) => {
      const raw = typeof data === 'string' ? data : data.toString('utf8');
      const parsed = safeJsonParse(raw);

      if (!authenticatedUserId) {
        if (!isAuthMessage(parsed)) {
          const msg: WsServerMessage = { type: 'error', message: 'Envie {type:"auth", token:"..."} primeiro.' };
          ws.send(JSON.stringify(msg));
          return;
        }

        const userId = await resolveUserIdFromAccessToken(parsed.token);
        if (!userId) {
          ws.close(4401, 'Unauthorized');
          return;
        }

        authenticatedUserId = userId;
        clearTimeout(authTimeout);
        deps.hub.add(ws, userId);

        const ready: WsServerMessage = { type: 'ready', userId };
        ws.send(JSON.stringify(ready));
        return;
      }

      if (parsed && typeof parsed === 'object' && (parsed as any).type === 'ping') {
        const pong: WsServerMessage = { type: 'pong' };
        ws.send(JSON.stringify(pong));
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
      deps.hub.remove(ws);
    });

    ws.on('error', (error) => {
      logger.warn({ error }, 'WebSocket connection error');
      deps.hub.remove(ws);
    });
  });
}
