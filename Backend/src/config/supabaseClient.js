import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
}

// We use the service role key on the backend to bypass RLS for server-side operations,
// OR we can pass the user's JWT to execute queries with their specific permissions.
// For operations where the backend acts on behalf of the user, passing the token is preferred.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || 'https://mock.supabase.co', 
  env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: WebSocket
    }
  }
);

// Helper to create a client scoped to a user's JWT
export const createSupabaseUserClient = (token) => {
  return createClient(
    env.SUPABASE_URL || 'https://mock.supabase.co',
    env.SUPABASE_ANON_KEY || 'mock-anon-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        transport: WebSocket
      }
    }
  );
};
