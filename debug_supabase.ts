import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  console.log('Checking profiles columns...');
  const { data: pData, error: pErr } = await supabase.from('profiles').select('name, companion_name, onboarding_completed').limit(1);
  console.log('Profiles:', pData, pErr);

  console.log('Checking chat_messages...');
  const { data: cData, error: cErr } = await supabase.from('chat_messages').select('*').limit(1);
  console.log('Chat messages:', cData, cErr);
}

check();
