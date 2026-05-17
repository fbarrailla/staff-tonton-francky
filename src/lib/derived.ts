import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import type { DayOff, Employee, SickLeave } from '@/types'
import { dayIsInRange, todayISO } from './utils'

export interface EmployeeDayStatus {
  status: 'working' | 'off' | 'sick'
  event?: DayOff | SickLeave
}

export function employeeStatusToday(
  employee: Employee,
  daysOff: DayOff[],
  sickLeaves: SickLeave[],
  todayIso = todayISO(),
): EmployeeDayStatus {
  const sick = sickLeaves.find(
    (s) =>
      s.employee_id === employee.id &&
      dayIsInRange(todayIso, s.start_date, s.end_date),
  )
  if (sick) return { status: 'sick', event: sick }
  const dayOff = daysOff.find(
    (d) =>
      d.employee_id === employee.id &&
      d.status === 'approved' &&
      dayIsInRange(todayIso, d.start_date, d.end_date),
  )
  if (dayOff) return { status: 'off', event: dayOff }
  return { status: 'working' }
}

export function monthlyDayOffBalance(
  employeeId: string,
  daysOff: DayOff[],
  month: Date = new Date(),
  monthlyQuota = 4,
) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const used = daysOff
    .filter(
      (d) =>
        d.employee_id === employeeId &&
        (d.status === 'approved' || d.status === 'pending') &&
        isWithinInterval(parseISO(d.start_date), { start, end }),
    )
    .reduce((sum, d) => sum + d.number_of_days, 0)
  return { used, remaining: Math.max(0, monthlyQuota - used), quota: monthlyQuota }
}

export function monthLabel(d: Date) {
  return format(d, "MMMM yyyy")
}
