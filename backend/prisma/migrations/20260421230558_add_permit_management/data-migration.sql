-- Data migration: Convert old single role to new roles array
-- This should be run manually if you have existing users

-- Migrate USER role
UPDATE "User" 
SET roles = ARRAY['USER']::\"Role\"[]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Note: Existing ADMIN users need manual role assignment
-- Run this for each admin user:
-- UPDATE "User" SET roles = ARRAY['ADMIN']::\"Role\"[] WHERE email = 'admin@example.com';
