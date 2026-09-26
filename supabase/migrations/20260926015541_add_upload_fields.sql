/*
# Add new fields to music_uploads

1. Modified Tables
- `music_uploads` — adds 6 new columns for richer upload metadata:
  - `real_name` (text, nullable) — real name or nickname of the submitter
  - `phone_number` (text, nullable) — phone number with area code
  - `tiktok_link` (text, nullable) — TikTok profile or video link
  - `production_year` (text, nullable) — year the song was produced
  - `lyrics_writer` (text, nullable) — who wrote the lyrics (free text)
  - `note_for_8plus` (text, nullable) — a note left for 8PlusMusic

2. Security
- No policy changes needed; existing RLS policies already allow full CRUD for anon+authenticated.
*/

ALTER TABLE music_uploads
  ADD COLUMN IF NOT EXISTS real_name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS tiktok_link text,
  ADD COLUMN IF NOT EXISTS production_year text,
  ADD COLUMN IF NOT EXISTS lyrics_writer text,
  ADD COLUMN IF NOT EXISTS note_for_8plus text;
