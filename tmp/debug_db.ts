import { supabase } from './lib/supabase';

async function debugBookings() {
  const { data: bookings, error: bError } = await supabase.from('bookings').select('*');
  console.log('Bookings in DB:', bookings);
  console.log('Error:', bError);

  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name, role');
  console.log('Profiles in DB:', profiles);
  console.log('Error:', pError);
  
  const { data: nurseProfiles, error: nError } = await supabase.from('nurse_profiles').select('id, user_id, verification_status');
  console.log('Nurse Profiles in DB:', nurseProfiles);
  console.log('Error:', nError);
}

debugBookings();
