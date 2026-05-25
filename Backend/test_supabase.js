import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key', {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: {
    transport: WebSocket
  }
});

console.log('Supabase client initialized successfully!');
