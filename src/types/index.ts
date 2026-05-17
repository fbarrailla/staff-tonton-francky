export type UUID = string

export type EmployeeStatus = 'active' | 'inactive'
export type EmployeeRole =
  | 'gerant'
  | 'agent_voyage'
  | 'developpeur'
  | 'ux_designer'
  | 'support_client'
  | 'editeur'
  | 'marketing'
  | 'comptable'

export interface Employee {
  id: UUID
  full_name: string
  email: string
  phone: string | null
  role: EmployeeRole
  skills: string[]
  avatar_url: string | null
  hired_at: string // ISO date
  status: EmployeeStatus
  created_at: string
  updated_at: string
}

export type DayOffStatus = 'pending' | 'approved' | 'rejected'

export interface DayOff {
  id: UUID
  employee_id: UUID
  start_date: string // ISO date
  end_date: string // ISO date (inclusive)
  number_of_days: number
  status: DayOffStatus
  reason: string
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface SickLeave {
  id: UUID
  employee_id: UUID
  start_date: string
  end_date: string
  number_of_days: number
  reason: string
  medical_certificate_url: string | null
  created_at: string
  updated_at: string
}

export interface DocumentRecord {
  id: UUID
  employee_id: UUID
  kind: 'avatar' | 'medical_certificate' | 'other'
  file_url: string
  file_name: string
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
}

export interface CalendarEvent {
  id: string
  employee_id: UUID
  employee_name: string
  avatar_url: string | null
  type: 'day_off' | 'sick_leave'
  status?: DayOffStatus
  start_date: string
  end_date: string
  reason?: string
}

export const ROLE_LABEL: Record<EmployeeRole, string> = {
  gerant: 'Gérant·e',
  agent_voyage: 'Agent de voyage',
  developpeur: 'Développeur·se',
  ux_designer: 'UX Designer',
  support_client: 'Support client',
  editeur: 'Éditeur·rice',
  marketing: 'Marketing',
  comptable: 'Comptable',
}

export const COMMON_SKILLS: string[] = [
  'Réservation aérienne',
  'Conseil voyage',
  'Édition ebook',
  'Marketing digital',
  'SEO',
  'React',
  'Node.js',
  'Supabase',
  'Design system',
  'Service client',
  'Anglais courant',
  'Espagnol',
  'Wolof',
  'Comptabilité',
  'Stripe',
  'InDesign',
  'Figma',
  'Rédaction web',
]
