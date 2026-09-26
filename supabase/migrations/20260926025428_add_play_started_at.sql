/*
# Add play_started_at column to music_uploads

1. Modified Tables
- `music_uploads`
  - Added `play_started_at` (timestamptz, nullable) — when the admin presses "Play"
  on a song, this column is set to `now()`. The public queue page reads this timestamp
  to sync voting: voting opens 30 seconds after `play_started_at` and then counts
  down 60 seconds. When the admin plays a different song or stops playback, this
  column is cleared on the previous song and set on the new one.
2. Security
- No RLS changes — the existing anon+authenticated policies on music_uploads
  already cover SELECT (public queue reads it) and UPDATE (admin uses the
  service-role supabase client from the dashboard, which bypasses RLS).
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'music_uploads' AND column_name = 'play_started_at'
  ) THEN
    ALTER TABLE music_uploads ADD COLUMN play_started_at timestamptz;
  END IF;
END $$;
