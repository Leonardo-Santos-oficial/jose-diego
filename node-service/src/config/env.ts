import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8081),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  REALTIME_URL: z.string().url()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Env validation failed');
}

export const env = parsed.data;
export type Env = typeof env;
