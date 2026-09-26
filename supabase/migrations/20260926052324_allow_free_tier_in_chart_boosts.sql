/*
# Allow 'free' tier in chart_boosts

Chart page free votes now insert into chart_boosts with tier='free' and weight=1
instead of song_votes. This separates live-stream votes (×100 in chart score)
from chart-page votes (weight as-is).
*/

ALTER TABLE chart_boosts DROP CONSTRAINT IF EXISTS chart_boosts_tier_check;

ALTER TABLE chart_boosts ADD CONSTRAINT chart_boosts_tier_check
  CHECK (tier IN ('free', 'boost_2', 'boost_5'));