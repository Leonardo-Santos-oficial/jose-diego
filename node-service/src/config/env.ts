import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8081),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REALTIME_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default(
    'https://gradbellagio.bet,https://grandbellagio.io,https://grandbellagio.gg,https://grandbellagio.com.br,https://grandbellagio.online,https://jose-diego.vercel.app,http://localhost:3000,http://localhost:5173'
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
