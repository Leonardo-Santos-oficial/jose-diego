import { lookup } from 'node:dns/promises';

import { getSupabaseServerClient } from '@/lib/supabase/serverClient';
import { AuthConfigurationError, AuthNetworkError } from '@/lib/auth/errors';

const DNS_CACHE_TTL = 60_000;
const dnsCache = new Map<string, number>();

type Credentials = {
  email: string;
  password: string;
};

type OAuthProvider = 'google';

type OAuthOptions = {
  redirectTo?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

type ClientFactory = () => Promise<SupabaseServerClient>;

type ConnectivityProbe = () => Promise<void>;

async function ensureSupabaseReachable(url?: string) {
  if (!url) {
    throw new AuthConfigurationError(
      'Configure NEXT_PUBLIC_SUPABASE_URL no arquivo .env.local.'
    );
  }

  let hostname: string;

  try {
    const parsedUrl = new URL(url);
    hostname = parsedUrl.hostname;
  } catch {
    throw new AuthConfigurationError('A URL do Supabase é inválida.');
  }

  const lastCheck = dnsCache.get(hostname);
  if (lastCheck && Date.now() - lastCheck < DNS_CACHE_TTL) {
    return;
  }

  try {
    await lookup(hostname);
    dnsCache.set(hostname, Date.now());
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Motivo desconhecido.';
    throw new AuthNetworkError(
      `Não foi possível alcançar ${hostname}. Verifique conexão, VPN ou bloqueios de DNS. Detalhes: ${reason}`
    );
  }
}

const defaultProbe: ConnectivityProbe = () =>
  ensureSupabaseReachable(process.env.NEXT_PUBLIC_SUPABASE_URL);

export class SupabaseAuthProxy {
  constructor(
    private readonly clientFactory: ClientFactory = getSupabaseServerClient,
    private readonly probe: ConnectivityProbe = defaultProbe
  ) {}

  private async getClient(): Promise<SupabaseServerClient> {
    await this.probe();
    return this.clientFactory();
  }

  async signUp(credentials: Credentials) {
    const client = await this.getClient();
    return client.auth.signUp(credentials);
  }

  async signIn(credentials: Credentials) {
    const client = await this.getClient();
    return client.auth.signInWithPassword(credentials);
  }

  async signOut() {
    const client = await this.getClient();
    return client.auth.signOut();
  }

  async signInWithOAuth(provider: OAuthProvider, options?: OAuthOptions) {
    const client = await this.getClient();
    return client.auth.signInWithOAuth({
      provider,
      options,
    });
  }

  async exchangeCodeForSession(code: string) {
    const client = await this.getClient();
    return client.auth.exchangeCodeForSession(code);
  }
}

export const supabaseAuthProxy = new SupabaseAuthProxy();
