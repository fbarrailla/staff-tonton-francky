-- =============================================================================
-- Add date_of_birth to employees, interns, applicants
-- =============================================================================
-- Optional date — captured at form-time, used to compute age on display
-- (interns also keep their legacy `age` column for backfill purposes).
-- Idempotent.
-- =============================================================================

alter table public.employees  add column if not exists date_of_birth date;
alter table public.interns    add column if not exists date_of_birth date;
alter table public.applicants add column if not exists date_of_birth date;
