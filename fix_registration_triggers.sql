-- ============================================
-- FIX: AUTOMATIC NURSE AND SHELTER CREATION
-- ============================================
-- Ensures that when a user registers, their nurse/shelter records are
-- created automatically via triggers, avoiding client-side RLS race conditions.

-- 1. Ensure unique constraints to prevent duplicates
ALTER TABLE public.nurse_profiles DROP CONSTRAINT IF EXISTS nurse_profiles_user_id_key;
ALTER TABLE public.nurse_profiles ADD CONSTRAINT nurse_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE public.shelters DROP CONSTRAINT IF EXISTS shelters_shelter_user_id_key;
ALTER TABLE public.shelters ADD CONSTRAINT shelters_shelter_user_id_key UNIQUE (shelter_user_id);

-- 2. Enhanced Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_location text;
BEGIN
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_phone := coalesce(new.raw_user_meta_data->>'phone', '');
  v_location := coalesce(new.raw_user_meta_data->>'location', '');

  -- Create Profile
  INSERT INTO public.profiles (id, email, name, phone, role, location)
  VALUES (new.id, new.email, v_name, v_phone, v_role, v_location)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    location = EXCLUDED.location;

  -- Create Nurse Profile if role is nurse
  IF v_role = 'nurse' THEN
    INSERT INTO public.nurse_profiles (
      user_id, 
      verification_status,
      specializations,
      experience,
      base_rate,
      location
    )
    VALUES (
      new.id, 
      'pending',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'specializations')), '{}'),
      COALESCE((new.raw_user_meta_data->>'experience')::integer, 0),
      COALESCE((new.raw_user_meta_data->>'baseRate')::numeric, 0),
      v_location
    )
    ON CONFLICT (user_id) DO UPDATE SET
      specializations = EXCLUDED.specializations,
      experience = EXCLUDED.experience,
      base_rate = EXCLUDED.base_rate,
      location = EXCLUDED.location;
  END IF;

  -- Create Shelter Record if role is shelter
  IF v_role = 'shelter' THEN
    INSERT INTO public.shelters (
      name, 
      address, 
      latitude, 
      longitude, 
      phone, 
      email, 
      capacity, 
      shelter_user_id
    )
    VALUES (
      v_name,
      v_location,
      COALESCE((new.raw_user_meta_data->>'shelterLat')::numeric, 0),
      COALESCE((new.raw_user_meta_data->>'shelterLng')::numeric, 0),
      v_phone,
      new.email,
      COALESCE((new.raw_user_meta_data->>'shelterCapacity')::integer, 50),
      new.id
    )
    ON CONFLICT (shelter_user_id) DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      capacity = EXCLUDED.capacity;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Clean up the other trigger to avoid double-processing
DROP TRIGGER IF EXISTS on_auth_user_created_shelter ON auth.users;
