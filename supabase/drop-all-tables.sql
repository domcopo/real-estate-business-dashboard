-- Drop All Tables Script
-- Run this FIRST if you want to start fresh
-- This will delete all existing tables and their data

-- Drop tables in reverse order of dependencies (child tables first)
DROP TABLE IF EXISTS ghl_weekly_metrics CASCADE;
DROP TABLE IF EXISTS ghl_clients CASCADE;
DROP TABLE IF EXISTS work_requests CASCADE;
DROP TABLE IF EXISTS rent_roll_units CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS websites CASCADE;
DROP TABLE IF EXISTS blops CASCADE;
DROP TABLE IF EXISTS agency_clients CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Note: This will also drop all indexes, triggers, and RLS policies automatically
-- due to CASCADE














