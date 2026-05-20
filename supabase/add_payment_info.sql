-- =============================================================================
-- Add payment info columns to employees
-- =============================================================================
-- All optional, plain text. Currently inherits the same RLS as the rest of
-- the employees table (any authenticated backoffice user can read). If you
-- want to lock these down to a specific role later, add a finance flag to
-- raw_user_meta_data and gate them with a column-level policy.
-- Idempotent.
-- =============================================================================

alter table public.employees add column if not exists crypto_wallet_address text;
alter table public.employees add column if not exists bank_account_holder   text;
alter table public.employees add column if not exists bank_account_number   text;
alter table public.employees add column if not exists bank_name             text;
