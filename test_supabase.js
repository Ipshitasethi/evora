import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ldpuijwbkrdhcsmyldum.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHVpandia3JkaGNzbXlsZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODg0MDQsImV4cCI6MjEwMDY2NDQwNH0.IogkTxDFQd1OjT3OE_bW5aB7Vh74ANM9XPj0oSpJQoE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing chat_messages fetch...');
  const { data, error } = await supabase.from('chat_messages').select('*').limit(1);
  console.log('Fetch Result:', data);
  if (error) console.error('Fetch Error:', JSON.stringify(error, null, 2));

  console.log('Testing chat_messages insert...');
  const { data: iData, error: iErr } = await supabase.from('chat_messages').insert({
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'user',
    content: 'test'
  });
  console.log('Insert Result:', iData);
  if (iErr) console.error('Insert Error:', JSON.stringify(iErr, null, 2));
}

run();
