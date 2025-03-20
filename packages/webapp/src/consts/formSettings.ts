import { CaptchaKindEnum } from '@heyform-inc/shared-types-enums'

export const CAPTCHA_KIND_OPTIONS = [
  {
    label: 'Disable',
    value: CaptchaKindEnum.NONE
  },
  { label: 'Google reCaptcha', value: CaptchaKindEnum.GOOGLE_RECAPTCHA },
  { label: 'GeeTest CAPTCHA', value: CaptchaKindEnum.GEETEST_CAPTCHA }
]

export const LOCALES_OPTIONS = [
  {
    label: 'English',
    value: 'en'
  },
  {
    label: 'Portugues',
    value: 'pt'
  },
  {
    label: 'Polski',
    value: 'pl'
  },
  {
    label: 'Türkçe',
    value: 'tr'
  },
  {
    label: '简体中文',
    value: 'zh-cn'
  },
  {
    label: '繁体中文',
    value: 'zh-tw'
  }
]

export const FORM_LOCALES_OPTIONS = [
  {
    label: 'English',
    value: 'en'
  },
  {
    label: 'Portugues',
    value: 'pt'
  },
  {
    label: 'German',
    value: 'de'
  },
  {
    label: 'French',
    value: 'fr'
  },
  {
    label: 'Polish',
    value: 'pl'
  },
  {
    label: 'Turkish',
    value: 'tr'
  },
  {
    label: 'Chinese (simplified)',
    value: 'zh-cn'
  },
  {
    label: 'Chinese (traditional)',
    value: 'zh-tw'
  }
]

export const TIME_LIMIT_OPTIONS = [
  {
    label: 'Hour',
    value: 'h'
  },
  {
    label: 'Minute',
    value: 'm'
  },
  {
    label: 'Second',
    value: 's'
  }
]

export const IP_LIMIT_OPTIONS = [
  {
    label: 'Day',
    value: 'd'
  },
  {
    label: 'Hour',
    value: 'h'
  },
  {
    label: 'Minute',
    value: 'm'
  }
]

export const EXPIRATION_DATE_FORMAT = 'MMM DD, YYYY hh:mm A'
