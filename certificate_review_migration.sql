-- ============================================
-- CERTIFICATE REVIEW TABLE — CareConnect
-- ============================================
-- Run this in your Supabase SQL Editor.
-- This creates the nurse_certificate_reviews table
-- which stores Roboflow AI analysis output and
-- admin approval decisions.

create table if not exists nurse_certificate_reviews (
  id uuid primary key default gen_random_uuid(),
  nurse_id uuid not null references profiles(id) on delete cascade,
  certificate_url text not null,          -- Supabase Storage public URL
  cropped_signature_url text,             -- Cropped bbox region uploaded to Storage
  detection_found boolean default false,  -- Did the model detect a signature?
  detection_confidence numeric,           -- Detection bbox confidence score (0-1)
  classifier_label text,                  -- 'genuine' or 'fake'
  classifier_confidence numeric,          -- Classifier confidence score (0-1)
  admin_status text not null default 'verification_pending', -- verification_pending / approved / denied
  admin_note text,                        -- Optional admin comment
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table nurse_certificate_reviews enable row level security;

-- Nurses can insert their own review requests
create policy "Nurses can insert own certificate reviews"
  on nurse_certificate_reviews for insert
  with check (auth.uid() = nurse_id);

-- Nurses can read their own reviews (to see their status)
create policy "Nurses can read own certificate reviews"
  on nurse_certificate_reviews for select
  using (auth.uid() = nurse_id);

-- Admins can do everything
create policy "Admins full access to certificate reviews"
  on nurse_certificate_reviews for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- NOTE: Also make sure your Storage bucket
-- 'careconnect-images' allows 'certificates/'
-- and 'cropped-signatures/' paths (public access).
-- ============================================
