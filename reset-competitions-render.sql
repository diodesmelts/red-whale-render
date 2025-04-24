-- Reset competitions for Blue Whale Competitions application
-- Run this directly in the Render PostgreSQL console
-- WARNING: This will delete all competition data!

-- Start a transaction for safety
BEGIN;

-- Temporarily disable foreign key constraints to avoid cascade issues
SET session_replication_role = 'replica';

-- Delete all entries 
DELETE FROM entries;
SELECT 'Deleted ' || COUNT(*) || ' entries' AS result FROM entries;

-- Delete all winners
DELETE FROM winners;  
SELECT 'Deleted ' || COUNT(*) || ' winners' AS result FROM winners;

-- Delete all competitions
DELETE FROM competitions;
SELECT 'Deleted ' || COUNT(*) || ' competitions' AS result FROM competitions;

-- Reset sequences (auto-increment IDs)
ALTER SEQUENCE IF EXISTS entries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS winners_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS competitions_id_seq RESTART WITH 1;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- Verify the tables are empty
SELECT 'Competitions left: ' || COUNT(*) AS verification FROM competitions;
SELECT 'Entries left: ' || COUNT(*) AS verification FROM entries;
SELECT 'Winners left: ' || COUNT(*) AS verification FROM winners;