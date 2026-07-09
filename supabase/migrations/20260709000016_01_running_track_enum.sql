-- PLAYHUB Module 7 (part 1): Add running_track to sport_type
-- Must run in its own migration — PostgreSQL forbids using a new enum
-- value in the same transaction that adds it (55P04).

ALTER TYPE public.sport_type ADD VALUE IF NOT EXISTS 'running_track';
