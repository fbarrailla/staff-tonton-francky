-- =============================================================================
-- Add address + geocoordinates to employees
-- =============================================================================
-- All nullable. Address strings come from Photon (OSM-based) autocomplete;
-- lat/lng are stored so we can render the team map without re-geocoding.
-- Idempotent.
-- =============================================================================

alter table public.employees add column if not exists address    text;
alter table public.employees add column if not exists city       text;
alter table public.employees add column if not exists country    text;
alter table public.employees add column if not exists latitude   numeric(9,6);
alter table public.employees add column if not exists longitude  numeric(9,6);

create index if not exists employees_country_idx on public.employees (country);
