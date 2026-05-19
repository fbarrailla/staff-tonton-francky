export type UUID = string

export type EmployeeStatus = 'active' | 'inactive'
export type EmployeeRole =
  | 'ceo'
  | 'cgo'
  | 'project_director'
  | 'cto'
  | 'account_administrator'
  | 'twitch_moderator'
  | 'webmaster'
  | 'graphic_designer'
  | 'copywriter'
  | 'video_makers'
  | 'marketing_specialist'
  | 'community_manager'
  | 'agent'
  | 'intern'

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  'ceo',
  'cgo',
  'project_director',
  'cto',
  'account_administrator',
  'twitch_moderator',
  'webmaster',
  'graphic_designer',
  'copywriter',
  'video_makers',
  'marketing_specialist',
  'community_manager',
  'agent',
  'intern',
]

export interface Employee {
  id: UUID
  full_name: string
  email: string
  phone: string | null
  role: EmployeeRole
  skills: string[]
  avatar_url: string | null
  hired_at: string // ISO date
  date_of_birth: string | null // ISO date
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

export type ApplicantStatus = 'nouveau' | 'en_revue' | 'entretien' | 'embauche' | 'refuse'

export interface Applicant {
  id: UUID
  full_name: string
  email: string
  phone: string | null
  skills: string[]
  applied_position: string | null
  status: ApplicantStatus
  cv_url: string | null                 // path in `applicants` bucket
  motivation_letter_url: string | null  // path in `applicants` bucket
  portfolio_url: string | null          // external URL
  admin_note: string | null
  applied_at: string                    // ISO date
  date_of_birth: string | null          // ISO date
  created_at: string
  updated_at: string
}

export const APPLICANT_STATUS_LABEL: Record<ApplicantStatus, string> = {
  nouveau: 'Nouveau',
  en_revue: 'En revue',
  entretien: 'Entretien',
  embauche: 'Embauché·e',
  refuse: 'Refusé·e',
}

export type InternStatus = 'pending' | 'active' | 'hired' | 'ended'

export interface Intern {
  id: UUID
  full_name: string
  email: string
  phone: string | null
  age: number | null
  date_of_birth: string | null // ISO date — preferred over age when both are present
  applied_at: string | null    // ISO date
  interview_at: string | null  // free-form
  status: InternStatus
  skills: string[]
  admin_note: string | null
  created_at: string
  updated_at: string
}

export const INTERN_STATUS_LABEL: Record<InternStatus, string> = {
  pending: 'En attente',
  active: 'En stage',
  hired: 'Embauché·e',
  ended: 'Terminé',
}

export interface TimeEntry {
  id: UUID
  user_id: UUID
  author_email: string | null  // denormalised from auth.users for joinability
  work_date: string            // ISO date
  hours: number
  description: string
  created_at: string
  updated_at: string
}

export const DAILY_HOURS_TARGET = 4

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
  ceo: 'CEO',
  cgo: 'CGO',
  project_director: 'Project director',
  cto: 'CTO',
  account_administrator: 'Account administrator',
  twitch_moderator: 'Twitch moderator',
  webmaster: 'Webmaster',
  graphic_designer: 'Graphic designer',
  copywriter: 'Copywriter',
  video_makers: 'Video maker',
  marketing_specialist: 'Marketing specialist',
  community_manager: 'Community manager',
  agent: 'Agent',
  intern: 'Intern',
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
