-- Stage B: the table `preferences-repository.ts` will query once you swap
-- the fixture for real Postgres. One row per distributor, same shape the
-- fixture already returns.
CREATE TABLE IF NOT EXISTS preferences (
  dist_id text PRIMARY KEY,
  celebration_dismissed boolean NOT NULL DEFAULT false
);
