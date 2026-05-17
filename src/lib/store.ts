import type { DayOff, Employee, SickLeave } from '@/types'
import { seedDaysOff, seedEmployees, seedSickLeaves } from './mockSeed'
import { newId, nowISO } from './utils'

/**
 * In-memory store mirrored to localStorage so the demo experience is fully
 * stateful across reloads without a real backend. When Supabase is configured,
 * a real adapter is used instead (see lib/api.ts).
 */

type DBShape = {
  version: number
  employees: Employee[]
  daysOff: DayOff[]
  sickLeaves: SickLeave[]
}

const KEY = 'tf-staff-db-v1'

function load(): DBShape {
  if (typeof localStorage === 'undefined') return fresh()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seed = fresh()
      localStorage.setItem(KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as DBShape
    if (!parsed.version) return fresh()
    return parsed
  } catch {
    return fresh()
  }
}

function persist(db: DBShape) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(db))
}

function fresh(): DBShape {
  const employees = seedEmployees()
  return {
    version: 1,
    employees,
    daysOff: seedDaysOff(employees),
    sickLeaves: seedSickLeaves(employees),
  }
}

let db: DBShape = load()

// Subscribers — keep React in sync on any mutation
type Listener = () => void
const listeners = new Set<Listener>()
function emit() {
  persist(db)
  listeners.forEach((l) => l())
}
export function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

// Read snapshots
export const snapshot = {
  employees: () => db.employees,
  daysOff: () => db.daysOff,
  sickLeaves: () => db.sickLeaves,
  employee: (id: string) => db.employees.find((e) => e.id === id) ?? null,
}

// Mutations
export const mutate = {
  resetDemo() {
    db = fresh()
    emit()
  },
  addEmployee(input: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const e: Employee = { ...input, id: newId(), created_at: nowISO(), updated_at: nowISO() }
    db.employees = [e, ...db.employees]
    emit()
    return e
  },
  updateEmployee(id: string, patch: Partial<Employee>) {
    db.employees = db.employees.map((e) =>
      e.id === id ? { ...e, ...patch, updated_at: nowISO() } : e,
    )
    emit()
  },
  deleteEmployee(id: string) {
    db.employees = db.employees.filter((e) => e.id !== id)
    db.daysOff = db.daysOff.filter((d) => d.employee_id !== id)
    db.sickLeaves = db.sickLeaves.filter((s) => s.employee_id !== id)
    emit()
  },
  addDayOff(input: Omit<DayOff, 'id' | 'created_at' | 'updated_at'>) {
    const d: DayOff = { ...input, id: newId(), created_at: nowISO(), updated_at: nowISO() }
    db.daysOff = [d, ...db.daysOff]
    emit()
    return d
  },
  updateDayOff(id: string, patch: Partial<DayOff>) {
    db.daysOff = db.daysOff.map((d) =>
      d.id === id ? { ...d, ...patch, updated_at: nowISO() } : d,
    )
    emit()
  },
  deleteDayOff(id: string) {
    db.daysOff = db.daysOff.filter((d) => d.id !== id)
    emit()
  },
  addSickLeave(input: Omit<SickLeave, 'id' | 'created_at' | 'updated_at'>) {
    const s: SickLeave = { ...input, id: newId(), created_at: nowISO(), updated_at: nowISO() }
    db.sickLeaves = [s, ...db.sickLeaves]
    emit()
    return s
  },
  updateSickLeave(id: string, patch: Partial<SickLeave>) {
    db.sickLeaves = db.sickLeaves.map((s) =>
      s.id === id ? { ...s, ...patch, updated_at: nowISO() } : s,
    )
    emit()
  },
  deleteSickLeave(id: string) {
    db.sickLeaves = db.sickLeaves.filter((s) => s.id !== id)
    emit()
  },
}
