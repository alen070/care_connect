import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xyefgkjcfetnptjzlcjo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CnzyxFb8vRS9sCutRXnDaA_EIHybnGP';
const supabase = createClient(supabaseUrl, supabaseKey);


async function test() {
  const email = `test_shelter${Date.now()}@test.com`;
  console.log('Registering Shelter:', email);
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: {
      data: {
        name: 'Test Shelter',
        phone: '9876543210',
        role: 'shelter',
        location: 'Kochi',
      }
    }
  });

  if (authErr) {
    console.error('SignUp Error:', authErr);
    return;
  }
  
  const user = authData.user;
  console.log('Signed up User ID:', user.id);

  console.log('Waiting 3 seconds for trigger...');
  await new Promise(r => setTimeout(r, 3000));

  // Try creating the shelter just like the frontend does
  console.log('Attempting ShelterDB.create...');
  const row = {
    name: 'New Shelter Auto',
    address: 'Pending Address',
    latitude: 0,
    longitude: 0,
    phone: 'Pending Phone',
    email: email,
    capacity: 50,
    shelter_user_id: user.id,
  };
  
  const { data: shelterData, error: shelterErr } = await supabase.from('shelters').insert(row).select().single();
  
  if (shelterErr) {
    console.error('Failed to insert shelter:', JSON.stringify(shelterErr, null, 2));
  } else {
    console.log('Successfully inserted shelter via frontend API logic:', shelterData.id);
  }
}

test();
