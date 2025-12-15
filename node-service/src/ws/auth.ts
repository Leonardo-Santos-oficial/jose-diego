import { supabaseServiceClient } from '../clients/supabaseClient.js';

export async function resolveUserIdFromAccessToken(token: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  const { data, error } = await supabaseServiceClient.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}
