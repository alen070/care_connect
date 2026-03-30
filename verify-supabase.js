import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyefgkjcfetnptjzlcjo.supabase.co';
const supabaseKey = 'sb_publishable_CnzyxFb8vRS9sCutRXnDaA_EIHybnGP';

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Fetching project health (profiles select)...');
    const start = Date.now();
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    console.log(`Request completed in ${Date.now() - start}ms`);

    if (error) {
      console.error('Connection Error:', error);
      if (error.message.includes('Failed to fetch')) {
        console.error('CRITICAL: The Supabase project is unreachable. Check if the project is PAUSED or if the URL is correct.');
      }
    } else {
      console.log('Successfully connected to Supabase!');
    }

    console.log('Testing Auth SignUp...');
    const authStart = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
    });
    console.log(`Auth request took: ${Date.now() - authStart}ms`);
    
    if (authError) {
        console.log('Auth error message:', authError.message);
        console.log('Auth error status:', authError.status);
    } else {
        console.log('Auth success! User ID:', authData.user?.id);
    }

  } catch (e) {
    console.error('Exception occurred during test:', e);
  }
}

test();
