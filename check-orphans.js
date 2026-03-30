import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyefgkjcfetnptjzlcjo.supabase.co';
const supabaseKey = 'sb_publishable_CnzyxFb8vRS9sCutRXnDaA_EIHybnGP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: shelters } = await supabase.from('shelters').select('*');
  console.log('--- SHELTERS ---');
  shelters?.forEach(s => console.log(`ID: ${s.id}, UserID: ${s.shelter_user_id}, Name: ${s.name}, Email: ${s.email}`));

  const { data: nurses } = await supabase.from('nurse_profiles').select('*');
  console.log('\n--- NURSE PROFILES ---');
  nurses?.forEach(n => console.log(`ID: ${n.id}, UserID: ${n.user_id}, Email: (N/A in this table)`));
}

check();
