import { locales } from '@heyform-inc/form-renderer'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { LOCALE_COOKIE_NAME } from '@/consts'
import de from '@/locales/de.json'
import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import ja from '@/locales/ja.json'
import pl from '@/locales/pl.json'
import zhCN from '@/locales/zh-cn.json'
import zhTW from '@/locales/zh-tw.json'

const resources = {
  de: {
    translation: {
      ...de,
      ...locales.de.translation
    }
  },
  en: {
    translation: {
      ...en,
      ...locales.en.translation
    }
  },
  fr: {
    translation: {
      ...fr,
      ...locales.fr.translation
    }
  },
  ja: {
    translation: {
      ...ja,
      ...locales.ja.translation
    }
  },
  pl: {
    translation: {
      ...pl,
      ...locales.pl.translation
    }
  },
  'zh-cn': {
    translation: {
      ...zhCN,
      ...locales['zh-cn'].translation
    }
  },
  'zh-tw': {
    translation: {
      ...zhTW,
      ...locales['zh-tw'].translation
    }
  }
}

const SUPPORTED_LNGS = Object.keys(resources)
export const DEFAULT_LNG = 'en'

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    lowerCaseLng: true,
    resources,
    fallbackLng: {
      default: [DEFAULT_LNG],
      zh: ['zh-cn']
    },
    supportedLngs: SUPPORTED_LNGS,
    interpolation: {
      escapeValue: false
    },
    react: {
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'b', 'i', 'a']
    },
    detection: {
      order: ['cookie', 'navigator'],
      caches: ['cookie'],
      lookupCookie: LOCALE_COOKIE_NAME,
      convertDetectedLanguage: (lng: string) => {
        const lowerLng = lng.toLowerCase()

        return (
          SUPPORTED_LNGS.find(l => lowerLng.startsWith(l) || l.startsWith(lowerLng)) || DEFAULT_LNG
        )
      }
    }
  })

export default i18n
