// =============================================================================
// App-wide configuration that's currently hard-coded but worth pulling out so
// it can be changed in one place. Move to env vars or a Supabase `settings`
// table when this grows.
// =============================================================================

/** Where new-application notifications get drafted. */
export const APPLICATION_NOTIFICATION = {
  to: 'punitpunia005@gmail.com',
  cc: 'francois.barrailla@gmail.com',
} as const

/** Public URL where /candidats/:id deep-links resolve in production. */
export const BACKOFFICE_PUBLIC_URL = 'https://staff.tontonfrancky.com'
