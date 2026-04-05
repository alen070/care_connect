-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('careconnect-images', 'careconnect-images', true) 
on conflict (id) do nothing;

-- Drop existing policies to recreate them (ignore errors if they don't exist)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own objects" on storage.objects;

-- Allow public read access to all objects in this bucket
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'careconnect-images' );

-- Allow authenticated users to upload objects
create policy "Authenticated users can upload" 
on storage.objects for insert 
with check ( bucket_id = 'careconnect-images' and auth.role() = 'authenticated' );

-- Allow users to update their own objects
create policy "Users can update their own objects" 
on storage.objects for update 
using ( bucket_id = 'careconnect-images' and auth.uid() = owner )
with check ( bucket_id = 'careconnect-images' and auth.uid() = owner );
