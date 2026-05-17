import type { DayOff, Employee, SickLeave } from '@/types'
import { newId, nowISO } from './utils'
import { addDays, format } from 'date-fns'

const isoDay = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

export function seedEmployees(): Employee[] {
  const now = nowISO()
  const e = (
    full_name: string,
    role: Employee['role'],
    skills: string[],
    phone: string,
    email: string,
    hiredOffset: number,
    status: Employee['status'] = 'active',
  ): Employee => ({
    id: newId(),
    full_name,
    email,
    phone,
    role,
    skills,
    avatar_url: null,
    hired_at: isoDay(hiredOffset),
    status,
    created_at: now,
    updated_at: now,
  })

  return [
    e('Aïssatou Diop', 'gerant', ['Conseil voyage', 'Anglais courant', 'Stripe'],
      '+221 77 123 45 67', 'aissatou@tontonfrancky.com', -1200),
    e('Mamadou Sarr', 'agent_voyage', ['Réservation aérienne', 'Service client', 'Wolof'],
      '+221 77 234 56 78', 'mamadou@tontonfrancky.com', -800),
    e('Fatou Ndiaye', 'agent_voyage', ['Conseil voyage', 'Espagnol'],
      '+221 77 345 67 89', 'fatou@tontonfrancky.com', -540),
    e('Ousmane Ba', 'developpeur', ['React', 'Node.js', 'Supabase'],
      '+221 77 456 78 90', 'ousmane@tontonfrancky.com', -420),
    e('Awa Camara', 'ux_designer', ['Design system', 'Figma'],
      '+221 77 567 89 01', 'awa@tontonfrancky.com', -360),
    e('Cheikh Diouf', 'editeur', ['Édition ebook', 'InDesign', 'Rédaction web'],
      '+221 77 678 90 12', 'cheikh@tontonfrancky.com', -300),
    e('Mariama Sow', 'marketing', ['SEO', 'Marketing digital', 'Rédaction web'],
      '+221 77 789 01 23', 'mariama@tontonfrancky.com', -260),
    e('Idrissa Fall', 'support_client', ['Service client', 'Wolof', 'Anglais courant'],
      '+221 77 890 12 34', 'idrissa@tontonfrancky.com', -180),
    e('Bineta Thiam', 'comptable', ['Comptabilité', 'Stripe'],
      '+221 77 901 23 45', 'bineta@tontonfrancky.com', -90),
    e('Lamine Diallo', 'developpeur', ['React', 'Supabase', 'Node.js'],
      '+221 77 012 34 56', 'lamine@tontonfrancky.com', -60),
    e('Nafissatou Gueye', 'editeur', ['Édition ebook', 'Rédaction web'],
      '+221 77 321 65 09', 'nafissatou@tontonfrancky.com', -45),
    e('Pape Mbaye', 'agent_voyage', ['Conseil voyage', 'Anglais courant'],
      '+221 77 654 32 10', 'pape@tontonfrancky.com', -30),
  ]
}

export function seedDaysOff(employees: Employee[]): DayOff[] {
  const list: DayOff[] = []
  const mk = (
    employee_id: string,
    start: number,
    end: number,
    status: DayOff['status'],
    reason: string,
    admin_note: string | null = null,
  ): DayOff => ({
    id: newId(),
    employee_id,
    start_date: isoDay(start),
    end_date: isoDay(end),
    number_of_days: end - start + 1,
    status,
    reason,
    admin_note,
    created_at: nowISO(),
    updated_at: nowISO(),
  })
  list.push(mk(employees[1].id, -2, 0, 'approved', 'Voyage familial à Saint-Louis'))
  list.push(mk(employees[2].id, 3, 5, 'pending', 'Mariage de mon frère'))
  list.push(mk(employees[4].id, 1, 2, 'approved', 'Rendez-vous médical'))
  list.push(mk(employees[6].id, 8, 9, 'pending', 'Repos personnel'))
  list.push(mk(employees[7].id, -5, -3, 'rejected', 'Voyage', 'Période trop chargée — reporté'))
  list.push(mk(employees[9].id, 14, 16, 'approved', 'Formation extérieure'))
  list.push(mk(employees[11].id, 6, 7, 'pending', 'Visite familiale'))
  list.push(mk(employees[3].id, -10, -8, 'approved', 'Repos'))
  return list
}

export function seedSickLeaves(employees: Employee[]): SickLeave[] {
  const mk = (
    employee_id: string,
    start: number,
    end: number,
    reason: string,
  ): SickLeave => ({
    id: newId(),
    employee_id,
    start_date: isoDay(start),
    end_date: isoDay(end),
    number_of_days: end - start + 1,
    reason,
    medical_certificate_url: null,
    created_at: nowISO(),
    updated_at: nowISO(),
  })
  return [
    mk(employees[5].id, -1, 1, 'Grippe saisonnière'),
    mk(employees[8].id, -7, -5, 'Migraine sévère'),
    mk(employees[10].id, 4, 6, 'Convalescence post-opératoire'),
  ]
}
