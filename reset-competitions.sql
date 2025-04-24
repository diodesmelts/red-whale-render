-- WARNING: This will delete all competition data
-- Run this in your PostgreSQL console to reset competition data

-- Start a transaction for safety
BEGIN;

-- Disable foreign key constraints temporarily to avoid cascade issues
SET session_replication_role = 'replica';

-- Delete all entries
DELETE FROM entries;

-- Delete all winners
DELETE FROM winners;

-- Delete all competitions
DELETE FROM competitions;

-- Reset sequences (auto-increment IDs)
ALTER SEQUENCE entries_id_seq RESTART WITH 1;
ALTER SEQUENCE winners_id_seq RESTART WITH 1;
ALTER SEQUENCE competitions_id_seq RESTART WITH 1;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- Verify the tables are empty
SELECT COUNT(*) FROM competitions;
SELECT COUNT(*) FROM entries;
SELECT COUNT(*) FROM winners;