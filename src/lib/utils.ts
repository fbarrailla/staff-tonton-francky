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
