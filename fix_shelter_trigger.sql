-- Create a trigger function to automatically create a shelter record when a shelter user signs up
CREATE OR REPLACE FUNCTION public.handle_new_shelter()
RETURNS trigger AS $$
BEGIN
  -- Only trigger if the user's role is 'shelter'
  IF new.raw_user_meta_data->>'role' = 'shelter' THEN
    INSERT INTO public.shelters (
      name, 
      address, 
      latitude, 
      longitude, 
      phone, 
      email, 
      capacity, 
      shelter_user_id
    ) VALUES (
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'location', ''),
      -- Safely cast lat/lng from JSON to float, default to 0 if missing
      coalesce((new.raw_user_meta_data->>'shelterLat')::numeric, 0),
      coalesce((new.raw_user_meta_data->>'shelterLng')::numeric, 0),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      new.email,
      coalesce((new.raw_user_meta_data->>'shelterCapacity')::integer, 50),
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

-- Drop the trigger if it already exists to recreate it cleanly
DROP TRIGGER IF EXISTS on_auth_user_created_shelter ON auth.users;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created_shelter
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_shelter();
