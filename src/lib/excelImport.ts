import type { Employee, EmployeeRole } from '@/types'
import { todayISO } from './utils'

// xlsx is ~430KB — load only when a file is actually parsed
async function loadXLSX() {
  const mod = await import('xlsx')
  return mod
}

// =============================================================================
// Excel → Employee row mapping
// =============================================================================
// Lenient column detection (case-insensitive, handles French/English headers)
// and a best-effort position → role-enum mapping. Original title is preserved
// as the first skill so nothing is lost.
// =============================================================================

const HEADER_ALIASES: Record<string, string[]> = {
  full_name: ['name', 'full name', 'nom', 'nom complet'],
  email: ['email', 'e-mail', 'mail', 'courriel'],
  phone: ['phone', 'telephone', 'téléphone', 'tel', 'mobile'],
  position: ['position', 'poste', 'role', 'rôle', 'title', 'job'],
  hired_at: ['date of application', "date d'embauche", 'hire date', 'hired_at', 'start date'],
  skills: ['skills', 'compétences', 'competences'],
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim().toLowerCase()
}

function buildHeaderMap(headers: unknown[]): Record<string, number> {
  const out: Record<string, number> = {}
  headers.forEach((raw, i) => {
    const h = normalizeHeader(raw)
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(h)) {
        if (out[field] === undefined) out[field] = i
      }
    }
  })
  return out
}

// Strip leading emojis/spaces and surrounding zero-width chars
function cleanTitle(raw: unknown): string {
  if (raw == null) return ''
  let s = String(raw).normalize('NFC')
  // Remove emoji + ZWJ + variation selectors
  s = s.replace(
    /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}‍️]/gu,
    '',
  )
  return s.trim().replace(/\s+/g, ' ')
}

function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null
  let s = String(raw).trim()
  if (!s || s === '?' || s.toLowerCase() === 'n/a') return null
  // Excel sometimes returns numbers as e.g. "6.28212120408e+11"
  if (/^[\d.]+e[+-]?\d+$/i.test(s)) {
    s = String(Number(s).toFixed(0))
  }
  s = s.replace(/[^\d+]/g, '')
  if (!s) return null
  if (s.startsWith('+')) return s
  // Already has a country code if length >= 11 — be lenient
  return '+' + s
}

function toISODate(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  // Excel may give us a Date, a number (serial), or a string
  if (raw instanceof Date) {
    const y = raw.getFullYear()
    const m = String(raw.getMonth() + 1).padStart(2, '0')
    const d = String(raw.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof raw === 'number') {
    // Excel serial — XLSX gives Date objects when cellDates: true, but
    // be defensive in case it doesn't
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(epoch.getTime() + raw * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = String(raw).trim()
  // Try DD/MM/YYYY (the format the user's xlsx uses)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  // Try YYYY-MM-DD passthrough
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return iso[0]
  return null
}

// =============================================================================
// Position → role enum mapping
// =============================================================================
// Keys are lowercased substrings; the FIRST match wins (so order matters).
const ROLE_RULES: { match: RegExp; role: EmployeeRole }[] = [
  // Leadership — match the specific acronyms before any broader rule
  { match: /\bceo\b/i, role: 'ceo' },
  { match: /\bcgo\b/i, role: 'cgo' },
  { match: /\bcto\b/i, role: 'cto' },
  { match: /\bproject[\s_-]?director\b|directeur[\s_-]?(?:de[\s_-]?)?projet/i, role: 'project_director' },

  // Twitch moderators are common in this team's data — keep this rule
  // before the broader "moderator/support" matchers
  { match: /\btwitch\b/i, role: 'twitch_moderator' },
  { match: /\b(moderator|moderateur|modérateur)\b/i, role: 'twitch_moderator' },

  // HR — match before generic "admin" rules
  { match: /\b(hr[\s_-]?staff|human[\s_-]?resources?|ressources?[\s_-]?humaines?|talent[\s_-]?acquisition|recruiter|recruteur)\b/i, role: 'hr_staff' },
  { match: /\bhr\b/i, role: 'hr_staff' },

  // Account / admin / finance
  { match: /\b(account[\s_-]?admin|account[\s_-]?administrator|admin[\s_-]?account)\b/i, role: 'account_administrator' },
  { match: /\b(comptable|accountant|finance|bookkeep)/i, role: 'account_administrator' },
  { match: /\baccount\b/i, role: 'account_administrator' },

  // Web / dev / IT
  { match: /\b(webmaster|web[\s_-]?master)\b/i, role: 'webmaster' },
  { match: /\b(developer|developpeur|développeur|engineer|cto|dev\b|frontend|backend|fullstack|full[\s_-]?stack)/i, role: 'webmaster' },

  // Design — split into Graphic designer (specific) vs Webmaster fallback
  { match: /\b(graphic[\s_-]?designer|graphic|graphist|graphiste)\b/i, role: 'graphic_designer' },
  { match: /\b(ux|ui|product[\s_-]?designer)\b/i, role: 'graphic_designer' },
  { match: /\bdesigner?\b/i, role: 'graphic_designer' },

  // Content
  { match: /\b(video[s]?[\s_-]?maker[s]?|videograph)/i, role: 'video_makers' },
  { match: /\b(video|motion|edit(or|eur)?|éditeur|cinematograph)\b/i, role: 'video_makers' },
  { match: /\b(copy[\s_-]?writer|writer|rédacteur|redacteur|copy|content|editorial)\b/i, role: 'copywriter' },

  // Marketing & community
  { match: /\b(community[\s_-]?manager|community)\b/i, role: 'community_manager' },
  { match: /\b(marketing[\s_-]?specialist|marketing|growth|seo|sea|paid|ads)\b/i, role: 'marketing_specialist' },

  // Internships
  { match: /\b(intern|stagiaire|internship|stage)\b/i, role: 'intern' },

  // Travel / Agent / generic
  { match: /\b(travel|voyage|agent|operator|advisor)\b/i, role: 'agent' },

  // Other leadership titles (COO/CFO/CMO/Founder/Director/etc.) — no
  // dedicated slot in the enum yet, fall back to project_director as the
  // closest leadership bucket
  { match: /\b(coo|cmo|cfo|founder|director|directeur|chief|gérant|gerant|head\sof)\b/i, role: 'project_director' },
]

export function inferRole(position: string): EmployeeRole {
  for (const rule of ROLE_RULES) {
    if (rule.match.test(position)) return rule.role
  }
  return 'agent'
}

// =============================================================================
// Parsing entry point
// =============================================================================

export type ParsedRow = Omit<Employee, 'id' | 'created_at' | 'updated_at'> & {
  __sourceRow: number
  __originalPosition: string
}

export interface ParseResult {
  sheetName: string
  rowsTotal: number
  rowsValid: ParsedRow[]
  rowsSkipped: { row: number; reason: string }[]
  detectedColumns: Record<string, number>
}

export async function parseEmployeesXlsx(file: File): Promise<ParseResult> {
  const XLSX = await loadXLSX()
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Prefer a sheet literally called "Employees"; otherwise the first sheet.
  const sheetName =
    wb.SheetNames.find((n) => /employ/i.test(n)) ?? wb.SheetNames[0]
  if (!sheetName) throw new Error('No sheet found in the workbook.')
  const ws = wb.Sheets[sheetName]

  // Get raw rows as arrays so we can be header-tolerant
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: null,
  })

  if (rows.length === 0) {
    return { sheetName, rowsTotal: 0, rowsValid: [], rowsSkipped: [], detectedColumns: {} }
  }

  const headers = rows[0]
  const colmap = buildHeaderMap(headers as unknown[])

  if (colmap.full_name === undefined || colmap.email === undefined) {
    throw new Error(
      `Required columns not found. The sheet must include "Name" and "Email" headers (case-insensitive). Detected headers: ${(headers as unknown[])
        .map(String)
        .filter(Boolean)
        .join(', ') || '(none)'}`,
    )
  }

  const rowsValid: ParsedRow[] = []
  const rowsSkipped: { row: number; reason: string }[] = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    const full_name = String(r[colmap.full_name] ?? '').trim()
    const email = String(r[colmap.email] ?? '').trim().toLowerCase()
    if (!full_name && !email) continue // truly blank row → silent skip
    if (!full_name) {
      rowsSkipped.push({ row: i + 1, reason: 'missing name' })
      continue
    }
    if (!email || !/.+@.+\..+/.test(email)) {
      rowsSkipped.push({ row: i + 1, reason: `invalid or missing email (got "${r[colmap.email] ?? ''}")` })
      continue
    }
    const rawPosition = colmap.position !== undefined ? r[colmap.position] : null
    const position = cleanTitle(rawPosition)
    const skills: string[] = position ? [position] : []
    // Extra skills column (CSV)
    if (colmap.skills !== undefined && r[colmap.skills]) {
      String(r[colmap.skills])
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s && !skills.includes(s))
        .forEach((s) => skills.push(s))
    }

    rowsValid.push({
      __sourceRow: i + 1,
      __originalPosition: position,
      full_name,
      email,
      phone: colmap.phone !== undefined ? normalizePhone(r[colmap.phone]) : null,
      role: position ? inferRole(position) : 'agent',
      skills,
      avatar_url: null,
      hired_at:
        (colmap.hired_at !== undefined ? toISODate(r[colmap.hired_at]) : null) ?? todayISO(),
      date_of_birth: null,
      status: 'active',
      address: null,
      city: null,
      country: null,
      latitude: null,
      longitude: null,
    })
  }

  return {
    sheetName,
    rowsTotal: rows.length - 1,
    rowsValid,
    rowsSkipped,
    detectedColumns: colmap,
  }
}
