import { useTranslation } from 'react-i18next'
import type { ApplicantStatus, EmployeeRole } from '@/types'

export function useRoleLabel() {
  const { t } = useTranslation()
  return (r: EmployeeRole) => t(`roles.${r}`)
}

export function useApplicantStatusLabel() {
  const { t } = useTranslation()
  return (s: ApplicantStatus) => t(`applicant_status.${s}`)
}
