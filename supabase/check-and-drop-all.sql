-- Check what tables exist and drop them all
-- Run this first to see what's there and clean it up

-- First, let's see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Now drop everything (run this part after checking what exists)
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

-- Verify everything is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;







