import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyefgkjcfetnptjzlcjo.supabase.co';
const supabaseKey = 'sb_publishable_CnzyxFb8vRS9sCutRXnDaA_EIHybnGP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: shelters } = await supabase.from('shelters').select('*');
  console.log('--- SHELTERS ---');
  shelters?.forEach(s => console.log(`ID: ${s.id}, UserID: ${s.shelter_user_id}, Name: ${s.name}`));

  const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'shelter');
  console.log('\n--- SHELTER PROFILES ---');
  profiles?.forEach(p => console.log(`ID: ${p.id}, Email: ${p.email}, Name: ${p.name}`));
}

check();
