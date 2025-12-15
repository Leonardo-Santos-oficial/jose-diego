export type WsClientMessage =
  | {
      type: 'auth';
      token: string;
    }
  | {
      type: 'ping';
    };

export type WsServerMessage =
  | {
      type: 'ready';
      userId: string;
    }
  | {
      type: 'event';
      topic: 'game.state' | 'game.history';
      payload: unknown;
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'pong';
    };
