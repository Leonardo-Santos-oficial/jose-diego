import type WebSocket from 'ws';
import { logger } from '../logger.js';
import type { WsServerMessage } from './types.js';

type AuthedConnection = {
  ws: WebSocket;
  userId: string;
};

export class WsHub {
  private readonly connections = new Set<AuthedConnection>();

  add(ws: WebSocket, userId: string): void {
    this.connections.add({ ws, userId });
  }

  remove(ws: WebSocket): void {
    for (const conn of this.connections) {
      if (conn.ws === ws) {
        this.connections.delete(conn);
        return;
      }
    }
  }

  broadcast(topic: WsServerMessage['topic'], payload: unknown): void {
    const message: WsServerMessage = { type: 'event', topic, payload };
    const encoded = JSON.stringify(message);

    for (const conn of this.connections) {
      if (conn.ws.readyState !== conn.ws.OPEN) {
        continue;
      }

      try {
        conn.ws.send(encoded);
      } catch (error) {
        logger.warn({ error }, 'Failed to send websocket message');
      }
    }
  }
}
