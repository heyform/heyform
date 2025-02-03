import de from './de'
import en from './en'
import fr from './fr'
import ja from './ja'
import pl from './pl'
import tr from './tr'
import zhCn from './zh-cn'
import zhTw from './zh-tw'
import es from './es'
import ptBr from './pt-br'
import cs from './cs'

export const locales: Record<string, any> = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  },
  de: {
    translation: de
  },
  es: {
    translation: es
  },
  ja: {
    translation: ja
  },
  pl: {
    translation: pl
  },
	'pt-br': {
    translation: ptBr
  },
  tr: {
    translation: tr
  },
  'zh-cn': {
    translation: zhCn
  },
  'zh-tw': {
    translation: zhTw
  },
  cs: {
    translation: cs
  }
}
