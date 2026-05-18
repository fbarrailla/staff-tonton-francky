import type { Applicant, DayOff, Employee, SickLeave } from '@/types'
import { supabase } from './supabase'
import { formatError } from './utils'

// =============================================================================
// Source of truth: Supabase. The store keeps an in-memory cache so the UI can
// read synchronously via useSyncExternalStore; mutations write to Supabase
// first, then update the cache and notify subscribers.
// =============================================================================

type DBShape = {
  employees: Employee[]
  daysOff: DayOff[]
  sickLeaves: SickLeave[]
  applicants: Applicant[]
  hydrated: boolean
  loading: boolean
  error: string | null
}

const db: DBShape = {
  employees: [],
  daysOff: [],
  sickLeaves: [],
  applicants: [],
  hydrated: false,
  loading: false,
  error: null,
}

// Subscribers ------------------------------------------------------------------
type Listener = () => void
const listeners = new Set<Listener>()
function emit() {
  listeners.forEach((l) => l())
}
export function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// Snapshots -------------------------------------------------------------------
export const snapshot = {
  employees: () => db.employees,
  daysOff: () => db.daysOff,
  sickLeaves: () => db.sickLeaves,
  applicants: () => db.applicants,
  hydrated: () => db.hydrated,
  loading: () => db.loading,
  error: () => db.error,
  employee: (id: string) => db.employees.find((e) => e.id === id) ?? null,
  applicant: (id: string) => db.applicants.find((a) => a.id === id) ?? null,
}

// Hydration -------------------------------------------------------------------
function requireClient() {
  if (!supabase) {
    throw new Error(
      'Supabase non configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}

export async function hydrate() {
  const client = requireClient()
  db.loading = true
  db.error = null
  emit()
  try {
    const [empRes, doRes, sickRes, appRes] = await Promise.all([
      client.from('employees').select('*').order('full_name', { ascending: true }),
      client.from('employee_days_off').select('*').order('start_date', { ascending: false }),
      client.from('employee_sick_leaves').select('*').order('start_date', { ascending: false }),
      client.from('applicants').select('*').order('applied_at', { ascending: false }),
    ])
    if (empRes.error) throw empRes.error
    if (doRes.error) throw doRes.error
    if (sickRes.error) throw sickRes.error
    if (appRes.error) throw appRes.error

    db.employees = (empRes.data ?? []) as Employee[]
    db.daysOff = (doRes.data ?? []) as DayOff[]
    db.sickLeaves = (sickRes.data ?? []) as SickLeave[]
    db.applicants = (appRes.data ?? []) as Applicant[]
    db.hydrated = true
    db.loading = false
    emit()
  } catch (e) {
    db.error = formatError(e)
    db.loading = false
    emit()
    throw e
  }
}

export function clearStore() {
  db.employees = []
  db.daysOff = []
  db.sickLeaves = []
  db.applicants = []
  db.hydrated = false
  db.loading = false
  db.error = null
  emit()
}

// Mutations -------------------------------------------------------------------
// All mutate.* functions are async, write to Supabase first, then patch the
// local cache and notify subscribers. They throw on Supabase errors so call
// sites can show toasts.

export const mutate = {
  async addEmployee(input: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employees')
      .insert(input)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.employees = [data as Employee, ...db.employees].sort((a, b) =>
      a.full_name.localeCompare(b.full_name, 'fr'),
    )
    emit()
    return data as Employee
  },

  async updateEmployee(id: string, patch: Partial<Employee>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employees')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.employees = db.employees.map((e) => (e.id === id ? (data as Employee) : e))
    emit()
    return data as Employee
  },

  async deleteEmployee(id: string) {
    const client = requireClient()
    const { error } = await client.from('employees').delete().eq('id', id)
    if (error) throw new Error(error.message)
    db.employees = db.employees.filter((e) => e.id !== id)
    db.daysOff = db.daysOff.filter((d) => d.employee_id !== id)
    db.sickLeaves = db.sickLeaves.filter((s) => s.employee_id !== id)
    emit()
  },

  async addDayOff(input: Omit<DayOff, 'id' | 'created_at' | 'updated_at'>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employee_days_off')
      .insert(input)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.daysOff = [data as DayOff, ...db.daysOff]
    emit()
    return data as DayOff
  },

  async updateDayOff(id: string, patch: Partial<DayOff>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employee_days_off')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.daysOff = db.daysOff.map((d) => (d.id === id ? (data as DayOff) : d))
    emit()
    return data as DayOff
  },

  async deleteDayOff(id: string) {
    const client = requireClient()
    const { error } = await client.from('employee_days_off').delete().eq('id', id)
    if (error) throw new Error(error.message)
    db.daysOff = db.daysOff.filter((d) => d.id !== id)
    emit()
  },

  async addSickLeave(input: Omit<SickLeave, 'id' | 'created_at' | 'updated_at'>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employee_sick_leaves')
      .insert(input)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.sickLeaves = [data as SickLeave, ...db.sickLeaves]
    emit()
    return data as SickLeave
  },

  async updateSickLeave(id: string, patch: Partial<SickLeave>) {
    const client = requireClient()
    const { data, error } = await client
      .from('employee_sick_leaves')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.sickLeaves = db.sickLeaves.map((s) => (s.id === id ? (data as SickLeave) : s))
    emit()
    return data as SickLeave
  },

  async deleteSickLeave(id: string) {
    const client = requireClient()
    const { error } = await client.from('employee_sick_leaves').delete().eq('id', id)
    if (error) throw new Error(error.message)
    db.sickLeaves = db.sickLeaves.filter((s) => s.id !== id)
    emit()
  },

  async addApplicant(input: Omit<Applicant, 'id' | 'created_at' | 'updated_at'>) {
    const client = requireClient()
    const { data, error } = await client
      .from('applicants')
      .insert(input)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.applicants = [data as Applicant, ...db.applicants]
    emit()
    return data as Applicant
  },

  async updateApplicant(id: string, patch: Partial<Applicant>) {
    const client = requireClient()
    const { data, error } = await client
      .from('applicants')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    db.applicants = db.applicants.map((a) => (a.id === id ? (data as Applicant) : a))
    emit()
    return data as Applicant
  },

  async deleteApplicant(id: string) {
    const client = requireClient()
    const { error } = await client.from('applicants').delete().eq('id', id)
    if (error) throw new Error(error.message)
    db.applicants = db.applicants.filter((a) => a.id !== id)
    emit()
  },
}
