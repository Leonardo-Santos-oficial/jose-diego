const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:8081';

export interface EngineClientConfig {
  baseUrl: string;
  timeout: number;
}

export interface BetRequest {
  roundId: string;
  userId: string;
  amount: number;
  autopayoutMultiplier?: number;
  strategyKey?: string;
}

export interface CashoutRequest {
  ticketId: string;
  userId: string;
  kind: 'manual' | 'auto';
}

export interface BetResponse {
  status: 'accepted' | 'rejected';
  ticketId?: string;
  roundId: string;
  userId: string;
  reason?: string;
  snapshot?: {
    balance: number;
    updatedAt: string;
  };
}

export interface CashoutResponse {
  status: 'credited' | 'rejected';
  ticketId: string;
  userId?: string;
  creditedAmount?: number;
  cashoutMultiplier?: number;
  payout?: number; // alias for creditedAmount
  multiplier?: number; // alias for cashoutMultiplier
  reason?: string;
  snapshot?: {
    balance: number;
    updatedAt: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  realtimeUrl: string;
}

export class EngineClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'EngineClientError';
  }
}

export class EngineHttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: Partial<EngineClientConfig> = {}) {
    this.baseUrl = config.baseUrl ?? ENGINE_URL;
    this.timeout = config.timeout ?? 10000;
  }

  async placeBet(request: BetRequest): Promise<BetResponse> {
    return this.post<BetResponse>('/bets', request);
  }

  async cashout(request: CashoutRequest): Promise<CashoutResponse> {
    return this.post<CashoutResponse>('/cashout', request);
  }

  async health(): Promise<HealthResponse> {
    return this.get<HealthResponse>('/health');
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new EngineClientError(
          data.message ?? `Request failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof EngineClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new EngineClientError('Request timeout', 408);
      }

      throw new EngineClientError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

let clientInstance: EngineHttpClient | null = null;

export function getEngineClient(): EngineHttpClient {
  if (!clientInstance) {
    clientInstance = new EngineHttpClient();
  }
  return clientInstance;
}
