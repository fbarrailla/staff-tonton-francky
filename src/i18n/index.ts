import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const SUPPORTED_LANGS = ['fr', 'en'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tf-lang',
      caches: ['localStorage'],
    },
    returnNull: false,
  })

// Keep <html lang="…"> reactive
function syncHtmlLang(lng: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.split('-')[0]
  }
}
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
