import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data } = await supabase.from('transactions').select('occurred_at').order('created_at', { ascending: false }).limit(1);
  console.log('Fetched:', data?.[0]?.occurred_at);
}
run();
