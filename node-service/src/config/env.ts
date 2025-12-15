import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8081),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REALTIME_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default(
    [
      // Produção (Vercel) — permitir todos os domínios do front
      'https://grandbellagio.online',
      'https://www.grandbellagio.online',
      'https://grandbellagio.gg',
      'https://www.grandbellagio.gg',
      'https://grandbellagio.com.br',
      'https://www.grandbellagio.com.br',
      'https://grandbellagio.io',
      'https://www.grandbellagio.io',
      'https://grandbellagio.bet',
      'https://www.grandbellagio.bet',
      // Domínio legado/typo já usado anteriormente
      'https://gradbellagio.bet',
      'https://www.gradbellagio.bet',
      // Vercel app
      'https://jose-diego.vercel.app',
      'https://www.jose-diego.vercel.app',
      // Dev
      'http://localhost:3000',
      'http://localhost:5173'
    ].join(',')
  )
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Env validation failed');
}

export const env = parsed.data;

// Parse ALLOWED_ORIGINS into array
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());

export type Env = typeof env;
