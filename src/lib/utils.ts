import { clsx, type ClassValue } from 'clsx'
import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(iso: string, pattern = 'd MMM yyyy') {
  try {
    return format(parseISO(iso), pattern, { locale: fr })
  } catch {
    return iso
  }
}

export function formatLongDate(iso: string) {
  return formatDate(iso, 'EEEE d MMMM yyyy')
}

export function inclusiveDayCount(startISO: string, endISO: string) {
  return Math.max(1, differenceInCalendarDays(parseISO(endISO), parseISO(startISO)) + 1)
}

export function dateRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  const a1 = parseISO(aStart)
  const a2 = parseISO(aEnd)
  const b1 = parseISO(bStart)
  const b2 = parseISO(bEnd)
  return a1 <= b2 && b1 <= a2
}

export function dayIsInRange(dayISO: string, startISO: string, endISO: string) {
  return isWithinInterval(parseISO(dayISO), {
    start: parseISO(startISO),
    end: parseISO(endISO),
  })
}

export function monthBounds(d: Date) {
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}

export function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nowISO() {
  return new Date().toISOString()
}

/**
 * Days until the next birthday + age the person will turn.
 * Returns null when dob is missing or invalid.
 * Considers today (0 days) up to the same day next year.
 */
export function nextBirthday(
  dob: string | null | undefined,
  ref: Date = new Date(),
): { days: number; turning: number; date: Date } | null {
  if (!dob) return null
  const birth = parseISO(dob)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < today) {
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate())
  }
  const days = Math.round((next.getTime() - today.getTime()) / 86400000)
  const turning = next.getFullYear() - birth.getFullYear()
  if (turning <= 0 || turning > 130) return null
  return { days, turning, date: next }
}

/** Whole-year age computed from a YYYY-MM-DD birth date; null when invalid. */
export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = parseISO(dob)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

/**
 * Robust error → string. Handles:
 *  - Error instances (.message)
 *  - Supabase PostgrestError-shaped objects (plain object with .message)
 *  - Strings
 *  - Anything else (JSON-serialise, fall back to a literal)
 */
export function formatError(e: unknown): string {
  if (!e) return 'Erreur inconnue'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  if (typeof e === 'object') {
    const obj = e as { message?: unknown; error_description?: unknown; details?: unknown }
    if (typeof obj.message === 'string' && obj.message) return obj.message
    if (typeof obj.error_description === 'string' && obj.error_description) return obj.error_description
    if (typeof obj.details === 'string' && obj.details) return obj.details
    try {
      const s = JSON.stringify(e)
      if (s && s !== '{}') return s
    } catch {
      /* fallthrough */
    }
  }
  return String(e)
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// Pseudo-deterministic warm avatar gradient from a string
const AVATAR_PALETTE = [
  ['#E66B2B', '#9F3E14'],
  ['#5E7148', '#43382A'],
  ['#C0395C', '#762D0E'],
  ['#D9A21B', '#5E4F3B'],
  ['#8E5A3B', '#2C2419'],
  ['#7A5A8E', '#43382A'],
]

export function avatarColors(seed: string): [string, string] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length] as [string, string]
}
