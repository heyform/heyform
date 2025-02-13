import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { locales } from '@/pages/form/views/FormComponents'

import en from './en'
import es from './es'
import pl from './pl'
import ptBr from './ptBr'
import tr from './tr'
import zhCn from './zhCn'
import zhTw from './zhTw'
import cs from './cs'

const resources = {
  en: {
    translation: {
      ...en,
      ...locales.en.translation
    }
  },
  pl: {
    translation: {
      ...pl,
      ...locales.pl.translation
    }
  },
  'pt-br': {
    translation: {
      ...ptBr,
      ...locales['pt-br'].translation
    }
  },
  tr: {
    translation: {
      ...tr,
      ...locales.tr.translation
    }
  },
  'zh-cn': {
    translation: {
      ...zhCn,
      ...locales['zh-cn'].translation
    }
  },
  'zh-tw': {
    translation: {
      ...zhTw,
      ...locales['zh-tw'].translation
    }
  },
  fr: locales.fr,
  de: locales.de,
  es: {
    translation: {
      ...es,
      ...locales.es.translation
    }
  },
  cs: {
    translation: {
      ...cs,
      ...locales.cs.translation
    }
  },
}

const LANG_ALIASES: Record<string, string> = {
  'zh-hans': 'zh-cn',
  'zh-hant': 'zh-tw',
  'pl-pl': 'pl'
}

const supportedLngs = Object.keys(resources)
const fallbackLng = supportedLngs[0]

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    debug: import.meta.env.DEV,
    lowerCaseLng: true,
    resources,
    fallbackLng,
    supportedLngs,
    interpolation: {
      escapeValue: false
    },
    react: {
      // https://react.i18next.com/latest/trans-component#trans-props
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'b', 'i', 'a']
    },
    detection: {
      order: ['cookie', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      lookupCookie: 'locale',
      convertDetectedLanguage: (lng: string) => {
        const lowerLng = lng.toLowerCase()

        if (LANG_ALIASES[lowerLng]) {
          return LANG_ALIASES[lowerLng]
        }

        return lng
      }
    }
  })

export default i18n
