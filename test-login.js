import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyefgkjcfetnptjzlcjo.supabase.co';
const supabaseKey = 'sb_publishable_CnzyxFb8vRS9sCutRXnDaA_EIHybnGP';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogin() {
  const email = 'filmstock93@gmail.com';
  console.log('Testing Login for:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Alen@2005'
  });
  
  if (error) {
    console.log('Error:', error.message, 'Status:', error.status);
  } else {
    console.log('Success! ID:', data.user?.id);
  }
}

checkLogin();
