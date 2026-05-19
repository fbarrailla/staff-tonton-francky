import type { Applicant } from '@/types'
import { APPLICATION_NOTIFICATION, BACKOFFICE_PUBLIC_URL } from './config'

/**
 * Open the user's email client with a draft notifying Punit (TO) + François
 * (CC) about a newly received application. The browser/OS handles the
 * attachment-less mailto handoff; the calling code keeps running.
 */
export function openNewApplicationDraft(applicant: Applicant) {
  const lines = [
    `Nouvelle candidature reçue sur le backoffice Tonton Francky :`,
    ``,
    `Nom        : ${applicant.full_name}`,
    `E-mail     : ${applicant.email}`,
    applicant.phone ? `Téléphone  : ${applicant.phone}` : null,
    applicant.applied_position ? `Poste visé : ${applicant.applied_position}` : null,
    applicant.applied_at ? `Date       : ${applicant.applied_at}` : null,
    ``,
    `Fiche complète :`,
    `${BACKOFFICE_PUBLIC_URL}/candidats/${applicant.id}`,
    ``,
    `— Envoyé automatiquement depuis Staff Tonton Francky.`,
  ].filter(Boolean) as string[]

  const subject = `Nouvelle candidature — ${applicant.full_name}${applicant.applied_position ? ' · ' + applicant.applied_position : ''}`

  const url =
    `mailto:${encodeURIComponent(APPLICATION_NOTIFICATION.to)}` +
    `?cc=${encodeURIComponent(APPLICATION_NOTIFICATION.cc)}` +
    `&subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(lines.join('\n'))}`

  // window.location.href on a mailto: triggers the OS mail handler without
  // navigating the page away — safer than window.open which popup blockers
  // tend to catch.
  if (typeof window !== 'undefined') window.location.href = url
}
