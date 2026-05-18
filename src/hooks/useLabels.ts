import { useTranslation } from 'react-i18next'
import type { ApplicantStatus, EmployeeRole, InternStatus } from '@/types'

export function useRoleLabel() {
  const { t } = useTranslation()
  return (r: EmployeeRole) => t(`roles.${r}`)
}

export function useApplicantStatusLabel() {
  const { t } = useTranslation()
  return (s: ApplicantStatus) => t(`applicant_status.${s}`)
}

export function useInternStatusLabel() {
  const { t } = useTranslation()
  return (s: InternStatus) => t(`intern_status.${s}`)
}
