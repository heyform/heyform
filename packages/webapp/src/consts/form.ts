import { FieldKindEnum, FieldLayoutAlignEnum } from '@heyform-inc/shared-types-enums'
import { IconCalendar, IconEyeOff, IconVariable } from '@tabler/icons-react'

import IconAddress from '@/assets/address.svg?react'
import IconCountry from '@/assets/country.svg?react'
import IconDateRange from '@/assets/date-range.svg?react'
import IconDateTime from '@/assets/date-time.svg?react'
import IconEmail from '@/assets/email.svg?react'
import IconFullPage from '@/assets/embed-fullpage.svg?react'
import IconModal from '@/assets/embed-modal.svg?react'
import IconPopup from '@/assets/embed-popup.svg?react'
import IconStandard from '@/assets/embed-standard.svg?react'
import IconFileUpload from '@/assets/file-upload.svg?react'
import IconFullName from '@/assets/full-name.svg?react'
import IconInputTable from '@/assets/input-table.svg?react'
import IconLayoutCover from '@/assets/layout-cover.svg?react'
import IconLayoutFloatLeft from '@/assets/layout-float-left.svg?react'
import IconLayoutFloatRight from '@/assets/layout-float-right.svg?react'
import IconLayoutInline from '@/assets/layout-inline.svg?react'
import IconLayoutSplitLeft from '@/assets/layout-split-left.svg?react'
import IconLayoutSplitRight from '@/assets/layout-split-right.svg?react'
import IconLegalTerms from '@/assets/legal-terms.svg?react'
import IconLongText from '@/assets/long-text.svg?react'
import IconMultipleIcon from '@/assets/multiple-choice.svg?react'
import IconNumber from '@/assets/number.svg?react'
import IconOpinionScale from '@/assets/opinion-scale.svg?react'
import IconPayment from '@/assets/payment.svg?react'
import IconPhoneNumber from '@/assets/phone-number.svg?react'
import IconPictureChoice from '@/assets/picture-choice.svg?react'
import IconQuestionGroup from '@/assets/question-group.svg?react'
import IconRating from '@/assets/rating.svg?react'
import IconShortText from '@/assets/short-text.svg?react'
import IconSignature from '@/assets/signature.svg?react'
import IconStatement from '@/assets/statement.svg?react'
import IconThankYou from '@/assets/thank-you.svg?react'
import IconVariableNumber from '@/assets/variable-number.svg?react'
import IconVariableString from '@/assets/variable-string.svg?react'
import IconWebsite from '@/assets/website.svg?react'
import IconWelcome from '@/assets/welcome.svg?react'
import IconYesNo from '@/assets/yes-no.svg?react'

export const FIELD_WELCOME_CONFIG = {
  kind: FieldKindEnum.WELCOME,
  icon: IconWelcome,
  label: 'form.builder.question.welcome',
  textColor: '#334155',
  backgroundColor: '#e5e7eb'
}

export const FIELD_THANK_YOU_CONFIG = {
  kind: FieldKindEnum.THANK_YOU,
  icon: IconThankYou,
  label: 'form.builder.question.thankYou',
  textColor: '#334155',
  backgroundColor: '#e5e7eb'
}

export const STANDARD_FIELD_CONFIGS = [
  {
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    icon: IconMultipleIcon,
    label: 'form.builder.question.multipleChoice',
    textColor: '#b91c1c',
    backgroundColor: '#fee2e2'
  },
  {
    kind: FieldKindEnum.PHONE_NUMBER,
    icon: IconPhoneNumber,
    label: 'form.builder.question.phoneNumber',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.SHORT_TEXT,
    icon: IconShortText,
    label: 'form.builder.question.shortText',
    textColor: '#15803d',
    backgroundColor: '#dcfce7'
  },
  {
    kind: FieldKindEnum.LONG_TEXT,
    icon: IconLongText,
    label: 'form.builder.question.longText',
    textColor: '#15803d',
    backgroundColor: '#dcfce7'
  },
  {
    kind: FieldKindEnum.PAYMENT,
    icon: IconPayment,
    label: 'form.builder.question.payment',
    textColor: '#a16207',
    backgroundColor: '#fef9c3'
  },
  {
    kind: FieldKindEnum.GROUP,
    icon: IconQuestionGroup,
    label: 'form.builder.question.questionGroup',
    textColor: '#334155',
    backgroundColor: '#e5e7eb'
  },
  {
    kind: FieldKindEnum.STATEMENT,
    icon: IconStatement,
    label: 'form.builder.question.statement',
    textColor: '#334155',
    backgroundColor: '#e5e7eb'
  },
  {
    kind: FieldKindEnum.PICTURE_CHOICE,
    icon: IconPictureChoice,
    label: 'form.builder.question.pictureChoice',
    textColor: '#b91c1c',
    backgroundColor: '#fee2e2'
  },
  {
    kind: FieldKindEnum.YES_NO,
    icon: IconYesNo,
    label: 'form.builder.question.yesNo',
    textColor: '#b91c1c',
    backgroundColor: '#fee2e2'
  },
  {
    kind: FieldKindEnum.EMAIL,
    icon: IconEmail,
    label: 'form.builder.question.email',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.FULL_NAME,
    icon: IconFullName,
    label: 'form.builder.question.fullName',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.RATING,
    icon: IconRating,
    label: 'form.builder.question.rating',
    textColor: '#a21caf',
    backgroundColor: '#fae8ff'
  },
  {
    kind: FieldKindEnum.OPINION_SCALE,
    icon: IconOpinionScale,
    label: 'form.builder.question.opinionScale',
    textColor: '#a21caf',
    backgroundColor: '#fae8ff'
  },
  {
    kind: FieldKindEnum.DATE,
    icon: IconDateTime,
    label: 'form.builder.question.dateTime',
    textColor: '#059669',
    backgroundColor: '#a7f3d0'
  },
  {
    kind: FieldKindEnum.DATE_RANGE,
    icon: IconDateRange,
    label: 'form.builder.question.dateRange',
    textColor: '#059669',
    backgroundColor: '#a7f3d0'
  },
  {
    kind: FieldKindEnum.NUMBER,
    icon: IconNumber,
    label: 'form.builder.question.number',
    textColor: '#0f766e',
    backgroundColor: '#ccfbf1'
  },
  {
    kind: FieldKindEnum.FILE_UPLOAD,
    icon: IconFileUpload,
    label: 'form.builder.question.fileUpload',
    textColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  },
  {
    kind: FieldKindEnum.ADDRESS,
    icon: IconAddress,
    label: 'form.builder.question.address',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.COUNTRY,
    icon: IconCountry,
    label: 'form.builder.question.country',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.LEGAL_TERMS,
    icon: IconLegalTerms,
    label: 'form.builder.question.legalTerms',
    textColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  },
  {
    kind: FieldKindEnum.SIGNATURE,
    icon: IconSignature,
    label: 'form.builder.question.signature',
    textColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  },
  {
    kind: FieldKindEnum.URL,
    icon: IconWebsite,
    label: 'form.builder.question.website',
    textColor: '#0369a1',
    backgroundColor: '#e0f2fe'
  },
  {
    kind: FieldKindEnum.INPUT_TABLE,
    icon: IconInputTable,
    label: 'form.builder.question.inputTable',
    textColor: '#c2410c',
    backgroundColor: '#ffedd5'
  }
]

export const ALL_FIELD_CONFIGS = [
  FIELD_WELCOME_CONFIG,
  FIELD_THANK_YOU_CONFIG,
  ...STANDARD_FIELD_CONFIGS
]

export const CUSTOM_FIELDS_CONFIGS = [
  {
    kind: FieldKindEnum.SUBMIT_DATE,
    icon: IconCalendar,
    label: 'form.builder.question.submitDate',
    textColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  },
  {
    kind: FieldKindEnum.HIDDEN_FIELDS,
    icon: IconEyeOff,
    label: 'form.builder.question.hiddenFields',
    textColor: '#334155',
    backgroundColor: '#e5e7eb'
  },
  {
    kind: FieldKindEnum.VARIABLE,
    icon: IconVariable,
    label: 'form.builder.question.variable',
    textColor: '#1d4ed8',
    backgroundColor: '#dbeafe'
  }
]

export const BLOCK_GROUPS = [
  [
    {
      name: 'form.builder.question.recommended',
      list: [
        FieldKindEnum.SHORT_TEXT,
        FieldKindEnum.MULTIPLE_CHOICE,
        FieldKindEnum.STATEMENT,
        FieldKindEnum.OPINION_SCALE,
        FieldKindEnum.EMAIL,
        FieldKindEnum.FULL_NAME
      ]
    }
  ],
  [
    {
      name: 'form.builder.question.contactInfo',
      list: [
        FieldKindEnum.PHONE_NUMBER,
        FieldKindEnum.EMAIL,
        FieldKindEnum.FULL_NAME,
        FieldKindEnum.ADDRESS,
        FieldKindEnum.COUNTRY,
        FieldKindEnum.URL
      ]
    },
    {
      name: 'form.builder.question.text',
      list: [FieldKindEnum.SHORT_TEXT, FieldKindEnum.LONG_TEXT]
    },

    {
      name: 'form.builder.question.fileUpload',
      list: [FieldKindEnum.FILE_UPLOAD]
    }
  ],
  [
    {
      name: 'form.builder.question.choices',
      list: [FieldKindEnum.MULTIPLE_CHOICE, FieldKindEnum.PICTURE_CHOICE, FieldKindEnum.YES_NO]
    },
    {
      name: 'form.builder.question.rating',
      list: [FieldKindEnum.RATING, FieldKindEnum.OPINION_SCALE]
    },
    {
      name: 'form.builder.question.date',
      list: [FieldKindEnum.DATE, FieldKindEnum.DATE_RANGE]
    },
    {
      name: 'form.builder.question.payment',
      list: [FieldKindEnum.PAYMENT]
    }
  ],
  [
    {
      name: 'form.builder.question.formStructure',
      list: [
        FieldKindEnum.GROUP,
        FieldKindEnum.STATEMENT,
        FieldKindEnum.WELCOME,
        FieldKindEnum.THANK_YOU
      ]
    },
    {
      name: 'form.builder.question.number',
      list: [FieldKindEnum.NUMBER]
    },
    {
      name: 'form.builder.question.data',
      list: [FieldKindEnum.INPUT_TABLE]
    },
    {
      name: 'form.builder.question.legalConsent',
      list: [FieldKindEnum.LEGAL_TERMS, FieldKindEnum.SIGNATURE]
    }
  ]
]

export const LAYOUT_OPTIONS = [
  {
    value: FieldLayoutAlignEnum.INLINE,
    icon: IconLayoutInline
  },
  {
    value: FieldLayoutAlignEnum.FLOAT_LEFT,
    icon: IconLayoutFloatLeft
  },
  {
    value: FieldLayoutAlignEnum.FLOAT_RIGHT,
    icon: IconLayoutFloatRight
  },
  {
    value: FieldLayoutAlignEnum.SPLIT_LEFT,
    icon: IconLayoutSplitLeft
  },
  {
    value: FieldLayoutAlignEnum.SPLIT_RIGHT,
    icon: IconLayoutSplitRight
  },
  {
    value: FieldLayoutAlignEnum.COVER,
    icon: IconLayoutCover
  }
]

export const DATE_FORMAT_OPTIONS = [
  {
    label: 'MM/DD/YYYY',
    value: 'MM/DD/YYYY'
  },
  {
    label: 'DD/MM/YYYY',
    value: 'DD/MM/YYYY'
  },
  {
    label: 'YYYY/MM/DD',
    value: 'YYYY/MM/DD'
  },
  {
    label: 'MM-DD-YYYY',
    value: 'MM-DD-YYYY'
  },
  {
    label: 'DD-MM-YYYY',
    value: 'DD-MM-YYYY'
  },
  {
    label: 'YYYY-MM-DD',
    value: 'YYYY-MM-DD'
  },
  {
    label: 'MM.DD.YYYY',
    value: 'MM.DD.YYYY'
  },
  {
    label: 'DD.MM.YYYY',
    value: 'DD.MM.YYYY'
  },
  {
    label: 'YYYY.MM.DD',
    value: 'YYYY.MM.DD'
  }
]

export const DATE_FORMAT_MAPS: AnyMap = {
  'MM/DD/YYYY': ['MM', 'DD', 'YYYY', '/'],
  'DD/MM/YYYY': ['DD', 'MM', 'YYYY', '/'],
  'YYYY/MM/DD': ['YYYY', 'MM', 'DD', '/'],
  'MM-DD-YYYY': ['MM', 'DD', 'YYYY', '-'],
  'DD-MM-YYYY': ['DD', 'MM', 'YYYY', '-'],
  'YYYY-MM-DD': ['YYYY', 'MM', 'DD', '-'],
  'MM.DD.YYYY': ['MM', 'DD', 'YYYY', '.'],
  'DD.MM.YYYY': ['DD', 'MM', 'YYYY', '.'],
  'YYYY.MM.DD': ['YYYY', 'MM', 'DD', '.'],
  'HH:mm': ['HH', 'mm', ':']
}

export const DATE_FORMAT_NAMES: AnyMap = {
  YYYY: {
    id: 'year',
    label: 'Year'
  },
  MM: {
    id: 'month',
    label: 'Month'
  },
  DD: {
    id: 'day',
    label: 'Day'
  },
  HH: {
    id: 'hour',
    label: 'Hour'
  },
  mm: {
    id: 'minute',
    label: 'Minute'
  }
}

export const FORM_EMBED_OPTIONS = [
  {
    value: 'standard',
    label: 'form.share.embed.standard',
    icon: IconStandard
  },
  {
    value: 'modal',
    label: 'form.share.embed.modal',
    icon: IconModal
  },
  {
    value: 'popup',
    label: 'form.share.embed.popup',
    icon: IconPopup
  },
  {
    value: 'fullpage',
    label: 'form.share.embed.fullpage',
    icon: IconFullPage
  }
]

export const DEFAULT_EMBED_CONFIGS = {
  standard: {
    widthType: '%',
    width: 100,
    heightType: 'px',
    height: 500,
    autoResizeHeight: true
  },
  modal: {
    size: 'large',
    openTrigger: 'click',
    openDelay: 5,
    openScrollPercent: 30,
    triggerBackground: '#1d4ed8',
    triggerText: 'Open Form',
    hideAfterSubmit: false,
    autoClose: 5
  },
  popup: {
    position: 'bottom-right',
    width: 420,
    height: 540,
    openTrigger: 'click',
    openDelay: 5,
    openScrollPercent: 30,
    triggerBackground: '#1d4ed8',
    hideAfterSubmit: false,
    autoClose: 5
  },
  fullpage: {
    transparentBackground: false
  }
}

export const INTEGRATION_CATEGORIES = [
  { value: 'Reporting', label: 'form.integrations.reporting' },
  { value: 'Analytics', label: 'form.integrations.analytics' },
  { value: 'Marketing', label: 'form.integrations.marketing' },
  { value: 'Automation', label: 'form.integrations.automation' },
  { value: 'Customer Support', label: 'form.integrations.customerSupport' },
  { value: 'Productivity', label: 'form.integrations.productivity' },
  { value: 'IT & Engineering', label: 'form.integrations.itEngineering' },
  { value: 'File Management', label: 'form.integrations.fileManagement' }
]

export enum APP_STATUS_ENUM {
  PENDING = 0,
  ACTIVE = 1,
  REDIRECT_TO_EXTERNAL = 2
}

export enum INTEGRATION_STATUS_ENUM {
  PERMITTED = 0,
  ACTIVE = 1,
  DISABLED
}

export const FORM_THEMES = [
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#000',
    answerTextColor: '#0445AF',
    buttonBackground: '#0445AF',
    buttonTextColor: '#fff',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#3D3D3D',
    answerTextColor: '#4FB0AE',
    buttonBackground: '#4FB0AE',
    buttonTextColor: '#fff',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#37404a',
    answerTextColor: '#5c5c5c',
    buttonBackground: '#37404a',
    buttonTextColor: '#fff',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#262627',
    answerTextColor: '#262627',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#ecddc2',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-01.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#262627',
    answerTextColor: '#262627',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#FBC4AD',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-02.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#262627',
    answerTextColor: '#262627',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#b1cbc0',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-03.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#9f5318',
    answerTextColor: '#cb732b',
    buttonBackground: '#cb732b',
    buttonTextColor: '#fff',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#b89837',
    answerTextColor: '#e4ba3f',
    buttonBackground: '#e4ba3f',
    buttonTextColor: '#000',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#5b9d6f',
    answerTextColor: '#7dbb91',
    buttonBackground: '#7dbb91',
    buttonTextColor: '#000',
    backgroundColor: '#fff',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Lato',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#F9F9F9',
    buttonTextColor: '#7A7A7A',
    backgroundColor: '#83cbcc',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-04.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#3D3D3D',
    answerTextColor: '#6E5C31',
    buttonBackground: '#8A763F',
    buttonTextColor: '#fff',
    backgroundColor: '#d5cdbb',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-05.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Lato',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#F9ADA8',
    buttonTextColor: '#98130B',
    backgroundColor: '#26317e',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-06.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Georgia',
    questionTextColor: '#2A3146',
    answerTextColor: '#C44665',
    buttonBackground: '#2A3146',
    buttonTextColor: '#F5F6F9',
    backgroundColor: '#e5e1da',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-07.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Sniglet',
    questionTextColor: '#3D3D3D',
    answerTextColor: '#437E93',
    buttonBackground: '#97D5E2',
    buttonTextColor: '#1B535F',
    backgroundColor: '#f2eee9',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-08.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Raleway',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#FBFBFB',
    buttonTextColor: '#7C7C7C',
    backgroundColor: '#0b0b0b',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-09.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Heebo',
    questionTextColor: '#262627',
    answerTextColor: '#000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#fabf7a',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-10.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Heebo',
    questionTextColor: '#262627',
    answerTextColor: '#000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#6FD3B7',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-11.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Heebo',
    questionTextColor: '#262627',
    answerTextColor: '#000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#71a8ca',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-12.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#262626',
    answerTextColor: '#262626',
    buttonBackground: '#262626',
    buttonTextColor: '#E5E5E5',
    backgroundColor: '#F1ECE2',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Montserrat',
    questionTextColor: '#262626',
    answerTextColor: '#262626',
    buttonBackground: '#FFFFFF',
    buttonTextColor: '#808080',
    backgroundColor: '#e3d8df',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-13.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#F1ECE2',
    answerTextColor: '#F1ECE2',
    buttonBackground: '#F1ECE2',
    buttonTextColor: '#F1ECE2',
    backgroundColor: '#262626',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#000000',
    answerTextColor: '#000000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#9BD7CF',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-14.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#000000',
    answerTextColor: '#000000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#F1ECE3',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-15.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#000000',
    answerTextColor: '#000000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#FEB494',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-16.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Oswald',
    questionTextColor: '#040404',
    answerTextColor: '#000000',
    buttonBackground: '#252525',
    buttonTextColor: '#E4E4E4',
    backgroundColor: '#F9CD48',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Lekton',
    questionTextColor: '#040404',
    answerTextColor: '#7E7E7E',
    buttonBackground: '#5182E0',
    buttonTextColor: '#08142A',
    backgroundColor: '#F3F3F3',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Arvo',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#407FD4',
    buttonBackground: '#4DC950',
    buttonTextColor: '#1e1e45',
    backgroundColor: '#1e1e45',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-17.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#262627',
    answerTextColor: '#262627',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#8ed2c8',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-18.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#FFFFFF',
    buttonTextColor: '#808080',
    backgroundColor: '#1f575e',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-19.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Public Sans',
    questionTextColor: '#262627',
    answerTextColor: '#262627',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#EEC395',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-20.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#8b3249',
    answerTextColor: '#c75875',
    buttonBackground: '#c75875',
    buttonTextColor: '#18080C',
    backgroundColor: '#FFFFFF',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#7a3d7c',
    answerTextColor: '#c384c5',
    buttonBackground: '#c384c5',
    buttonTextColor: '#321832',
    backgroundColor: '#FFFFFF',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Arimo',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#2B6F75',
    buttonTextColor: '#fff',
    backgroundColor: '#1c4b51',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-21.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Arimo',
    questionTextColor: '#262627',
    answerTextColor: '#000000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#F6A42B',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-22.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Arimo',
    questionTextColor: '#262627',
    answerTextColor: '#000000',
    buttonBackground: '#262627',
    buttonTextColor: '#E5E5E6',
    backgroundColor: '#cbcbcb',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-23.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#eeeeee',
    answerTextColor: '#eeeeee',
    buttonBackground: '#eeeeee',
    buttonTextColor: '#6F6F6F',
    backgroundColor: '#408e91',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#eeeeee',
    answerTextColor: '#eeeeee',
    buttonBackground: '#eeeeee',
    buttonTextColor: '#6F6F6F',
    backgroundColor: '#4fb0ae',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#eeeeee',
    answerTextColor: '#eeeeee',
    buttonBackground: '#eeeeee',
    buttonTextColor: '#6F6F6F',
    backgroundColor: '#cb732b',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#eeeeee',
    answerTextColor: '#eeeeee',
    buttonBackground: '#eeeeee',
    buttonTextColor: '#6F6F6F',
    backgroundColor: '#7dbb91',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#eeeeee',
    answerTextColor: '#eeeeee',
    buttonBackground: '#eeeeee',
    buttonTextColor: '#6F6F6F',
    backgroundColor: '#c384c5',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#535353',
    answerTextColor: '#1A91A2',
    buttonBackground: '#FFFFFF',
    buttonTextColor: '#808080',
    backgroundColor: '#d8ebeb',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-24.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Source Sans Pro',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#358BF3',
    buttonBackground: '#FFFFFF',
    buttonTextColor: '#808080',
    backgroundColor: '#B8CBE2',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-25.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#DAB1AD',
    buttonTextColor: '#5E2F2A',
    backgroundColor: '#7B6771',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-26.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#E0FBFF',
    buttonBackground: '#D25476',
    buttonTextColor: '#1F080E',
    backgroundColor: '#2c2c2c',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-27.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Source Sans Pro',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#FFFFFF',
    buttonTextColor: '#808080',
    backgroundColor: '#141518',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-28.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Work Sans',
    questionTextColor: '#272727',
    answerTextColor: '#272727',
    buttonBackground: '#272727',
    buttonTextColor: '#E6E6E6',
    backgroundColor: '#74dba6',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-29.png',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#FFFFFF',
    answerTextColor: '#FFFFFF',
    buttonBackground: '#5DD2F1',
    buttonTextColor: '#063B49',
    backgroundColor: '#7159bc',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-30.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#0C0C0C',
    answerTextColor: '#0C0C0C',
    buttonBackground: '#E26D5A',
    buttonTextColor: '#340F09',
    backgroundColor: '#acb0b0',
    backgroundImage: 'https://forms.b-cdn.net/themev3/theme-background-31.jpeg',
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#6cbf2c',
    answerTextColor: '#89bc62',
    buttonBackground: '#c6dfb2',
    buttonTextColor: '#46672B',
    backgroundColor: '#f3f9ef',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#e66902',
    answerTextColor: '#cb732b',
    buttonBackground: '#e6bb98',
    buttonTextColor: '#663C19',
    backgroundColor: '#faf1ea',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#e6ac00',
    answerTextColor: '#e4ba3f',
    buttonBackground: '#EDD59A',
    buttonTextColor: '#735815',
    backgroundColor: '#fdf8ec',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#bf395d',
    answerTextColor: '#c75875',
    buttonBackground: '#e4adbc',
    buttonTextColor: '#6E2438',
    backgroundColor: '#faeef1',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#c968cc',
    answerTextColor: '#c384c5',
    buttonBackground: '#e2c3e3',
    buttonTextColor: '#703572',
    backgroundColor: '#f9f3fa',
    backgroundImage: undefined,
    backgroundBrightness: 0
  },
  {
    fontFamily: 'Karla',
    questionTextColor: '#38bdcf',
    answerTextColor: '#73bec8',
    buttonBackground: '#bbe0e5',
    buttonTextColor: '#2D6C75',
    backgroundColor: '#f1f9fa',
    backgroundImage: undefined,
    backgroundBrightness: 0
  }
]

export const VARIABLE_KIND_CONFIGS = [
  {
    kind: 'number' as FieldKindEnum,
    icon: IconVariableNumber,
    label: 'form.builder.question.number',
    textColor: '#fff',
    backgroundColor: '#09090B'
  },
  {
    kind: 'string' as FieldKindEnum,
    icon: IconVariableString,
    label: 'form.builder.question.string',
    textColor: '#fff',
    backgroundColor: '#09090B'
  }
]

export const VARIABLE_INPUT_TYPES: AnyMap = {
  number: 'number',
  string: 'text'
}

export const SINGLE_CHOICE_CONDITIONS = [
  {
    value: 'is',
    label: 'form.builder.logic.rule.is'
  },
  {
    value: 'is_not',
    label: 'form.builder.logic.rule.isNot'
  }
]

export const TRUE_FALSE_CONDITIONS = [
  {
    value: true,
    label: 'form.builder.logic.rule.true'
  },
  {
    value: false,
    label: 'form.builder.logic.rule.false'
  }
]

export const MULTIPLE_CHOICE_CONDITIONS = [
  ...SINGLE_CHOICE_CONDITIONS,
  {
    value: 'contains',
    label: 'form.builder.logic.rule.contains'
  },
  {
    value: 'does_not_contain',
    label: 'form.builder.logic.rule.doesNotContain'
  }
]

export const TEXT_CONDITIONS = [
  ...MULTIPLE_CHOICE_CONDITIONS,
  {
    value: 'starts_with',
    label: 'form.builder.logic.rule.startsWith'
  },
  {
    value: 'ends_with',
    label: 'form.builder.logic.rule.endsWith'
  }
]

export const DATE_CONDITIONS = [
  ...SINGLE_CHOICE_CONDITIONS,
  {
    value: 'is_before',
    label: 'form.builder.logic.rule.isBefore'
  },
  {
    value: 'is_after',
    label: 'form.builder.logic.rule.isAfter'
  }
]

export const NUMBER_CONDITIONS = [
  {
    value: 'equal',
    label: 'form.builder.logic.rule.equal'
  },
  {
    value: 'not_equal',
    label: 'form.builder.logic.rule.notEqual'
  },
  {
    value: 'greater_than',
    label: 'form.builder.logic.rule.greaterThan'
  },
  {
    value: 'greater_or_equal_than',
    label: 'form.builder.logic.rule.greaterOrEqualThan'
  },
  {
    value: 'less_or_equal_than',
    label: 'form.builder.logic.rule.lessOrEqualThan'
  }
]

export const DEFAULT_COMPARISONS = [
  {
    value: 'is_empty',
    label: 'form.builder.logic.rule.isEmpty'
  },
  {
    value: 'is_not_empty',
    label: 'form.builder.logic.rule.isNotEmpty'
  }
]

export const ACTIONS = [
  {
    value: 'navigate',
    label: 'form.builder.logic.rule.navigate'
  },
  {
    value: 'calculate',
    label: 'form.builder.logic.rule.calculate'
  }
]

export const OPERATORS = [
  {
    value: 'addition',
    label: 'form.builder.logic.rule.addition'
  },
  {
    value: 'subtraction',
    label: 'form.builder.logic.rule.subtraction'
  },
  {
    value: 'multiplication',
    label: 'form.builder.logic.rule.multiplication'
  },
  {
    value: 'division',
    label: 'form.builder.logic.rule.division'
  },
  {
    value: 'assignment',
    label: 'form.builder.logic.rule.assignment'
  }
]

export const ADD_QUESTION_STORAGE_NAME = 'ADD_QUESTION'
export const ADD_QUESTION2_STORAGE_NAME = 'ADD_QUESTION2'
export const PUBLISH_FORM_STORAGE_NAME = 'PUBLISH_FORM'
export const MAXIMIZE_TABLE_STORAGE_NAME = 'MAXIMIZE_TABLE'

export const TEMPLATE_CATEGORIES = [
  'Survey',
  'Lead Generation',
  'Customer Support',
  'Feedback',
  'Employee/Job',
  'Booking & Order',
  'Marketing',
  'Registration',
  'Education',
  'Event',
  'Healthcare',
  'Application',
  'Questionnaire & Quiz',
  'Remote Working',
  'Contact',
  'Business',
  'COVID-19',
  'Poll',
  'Request',
  'Banking & Finance',
  'Donation & Charity'
]

export const DEFAULT_CUSTOM_REPORT_THEME = {
  fontFamily: 'Inter',
  heading: 'rgb(9, 9, 11)',
  question: 'rgb(9, 9, 11)',
  chart: 'rgb(37, 99, 235)',
  backgroundColor: '#fff'
}

export const GRADIENTS = [
  'linear-gradient(-225deg, rgb(171, 236, 214) 0%, rgb(251, 237, 150) 100%)',
  'linear-gradient(to top, #ff6a00 0%, #ee0979 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(to right, #56ab2f 0%, #a8e063 100%)',
  'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(-225deg, #a8c0ff 0%, #3f2b96 100%)',
  'linear-gradient(60deg, #ff6ec4 0%, #7873f5 100%)',
  'linear-gradient(-225deg, rgb(255, 206, 153) 0%, rgb(191, 255, 186) 100%)',
  'linear-gradient(-225deg, rgb(222, 192, 255) 0%, rgb(255, 245, 175) 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(45deg, #d9afd9 0%, #97d9e1 100%)',
  'linear-gradient(to top, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(-225deg, #b7f8db 0%, #50a7c2 100%)',
  'linear-gradient(45deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(to right, #36096d 0%, #37d5d6 100%)',
  'linear-gradient(-225deg, #cc2b5e 0%, #753a88 100%)',
  'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
  'linear-gradient(45deg, rgb(253, 239, 132), rgb(247, 198, 169), rgb(21, 186, 196))',
  'linear-gradient(to right, #2bc0e4, #eaecc6)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(to right, #4BC0C8, #C779D0, #FEAC5E)',
  'linear-gradient(45deg, rgb(105, 234, 203), rgb(234, 204, 248), rgb(102, 84, 241))',
  'linear-gradient(180deg, #2af598 0%, #009efd 100%)',
  'linear-gradient(45deg, rgb(255, 37, 37), rgb(255, 229, 59))',
  'linear-gradient(to top, #00c6fb 0%, #005bea 100%)',
  'linear-gradient(to top, #50cc7f 0%, #f5d100 100%)',
  'linear-gradient(to top, #88d3ce 0%, #6e45e2 100%)',
  'linear-gradient(45deg, rgb(217, 244, 255), rgb(255, 143, 167), rgb(93, 104, 255))',
  'linear-gradient(to top, #fcc5e4 0%, #fda34b 15%, #ff7882 35%, #c8699e 52%, #7046aa 71%, #0c1db8 87%, #020f75 100%)',
  'linear-gradient(-225deg, #FF057C 0%, #8D0B93 50%, #321575 100%)',
  'linear-gradient(-225deg, #231557 0%, #44107A 29%, #FF1361 67%, #FFF800 100%)',
  'radial-gradient(circle farthest-corner at 32% 106%, rgb(255, 225, 125) 0%, rgb(255, 205, 105) 10%, rgb(250, 145, 55) 28%, rgb(235, 65, 65) 42%, transparent 82%), linear-gradient(135deg, rgb(35, 75, 215) 12%, rgb(195, 60, 190) 58%)',
  'linear-gradient(to right, #00dbde, #fc00ff)',
  'linear-gradient(45deg, #ff9a9e 0%,#fad0c4 99%,#fad0c4 100%)',
  'linear-gradient(0deg, #a18cd1 0%,#fbc2eb 100%)',
  'linear-gradient(0deg, #fad0c4 0%,#fad0c4 1%,#ffd1ff 100%)',
  'linear-gradient(90deg, #ffecd2 0%,#fcb69f 100%)',
  'linear-gradient(90deg, #ff8177 0%,#ff867a 0%,#ff8c7f 21%,#f99185 52%,#cf556c 78%,#b12a5b 100%)',
  'linear-gradient(0deg, #ff9a9e 0%,#fecfef 99%,#fecfef 100%)',
  'linear-gradient(120deg, #f6d365 0%,#fda085 100%)',
  'linear-gradient(0deg, #fbc2eb 0%,#a6c1ee 100%)',
  'linear-gradient(0deg, #fdcbf1 0%,#fdcbf1 1%,#e6dee9 100%)',
  'linear-gradient(120deg, #a1c4fd 0%,#c2e9fb 100%)',
  'linear-gradient(120deg, #d4fc79 0%,#96e6a1 100%)',
  'linear-gradient(120deg, #84fab0 0%,#8fd3f4 100%)',
  'linear-gradient(0deg, #cfd9df 0%,#e2ebf0 100%)',
  'linear-gradient(120deg, #a6c0fe 0%,#f68084 100%)',
  'linear-gradient(120deg, #fccb90 0%,#d57eeb 100%)',
  'linear-gradient(120deg, #e0c3fc 0%,#8ec5fc 100%)',
  'linear-gradient(120deg, #f093fb 0%,#f5576c 100%)',
  'linear-gradient(120deg, #fdfbfb 0%,#ebedee 100%)',
  'linear-gradient(0deg, #4facfe 0%,#00f2fe 100%)',
  'linear-gradient(0deg, #43e97b 0%,#38f9d7 100%)',
  'linear-gradient(0deg, #fa709a 0%,#fee140 100%)',
  'linear-gradient(0deg, #30cfd0 0%,#330867 100%)',
  'linear-gradient(0deg, #a8edea 0%,#fed6e3 100%)',
  'linear-gradient(0deg, #5ee7df 0%,#b490ca 100%)',
  'linear-gradient(0deg, #d299c2 0%,#fef9d7 100%)',
  'linear-gradient(135deg, #f5f7fa 0%,#c3cfe2 100%)',
  'linear-gradient(0deg, #16d9e3 0%,#30c7ec 47%,#46aef7 100%)',
  'linear-gradient(135deg, #667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg, #fdfcfb 0%,#e2d1c3 100%)',
  'linear-gradient(120deg, #89f7fe 0%,#66a6ff 100%)',
  'linear-gradient(0deg, #fddb92 0%,#d1fdff 100%)',
  'linear-gradient(0deg, #9890e3 0%,#b1f4cf 100%)',
  'linear-gradient(0deg, #ebc0fd 0%,#d9ded8 100%)',
  'linear-gradient(0deg, #96fbc4 0%,#f9f586 100%)',
  'linear-gradient(180deg, #2af598 0%,#009efd 100%)',
  'linear-gradient(0deg, #cd9cf2 0%,#f6f3ff 100%)',
  'linear-gradient(0deg, #e4afcb 0%,#b8cbb8 0%,#b8cbb8 0%,#e2c58b 30%,#c2ce9c 64%,#7edbdc 100%)',
  'linear-gradient(0deg, #b8cbb8 0%,#b8cbb8 0%,#b465da 0%,#cf6cc9 33%,#ee609c 66%,#ee609c 100%)',
  'linear-gradient(0deg, #6a11cb 0%,#2575fc 100%)',
  'linear-gradient(0deg, #37ecba 0%,#72afd3 100%)',
  'linear-gradient(0deg, #ebbba7 0%,#cfc7f8 100%)',
  'linear-gradient(0deg, #fff1eb 0%,#ace0f9 100%)',
  'linear-gradient(0deg, #eea2a2 0%,#bbc1bf 19%,#57c6e1 42%)',
  'linear-gradient(0deg, #c471f5 0%,#fa71cd 100%)',
  'linear-gradient(0deg, #48c6ef 0%,#6f86d6 100%)',
  'linear-gradient(0deg, #f78ca0 0%,#f9748f 19%,#fd868c 60%)',
  'linear-gradient(0deg, #feada6 0%,#f5efef 100%)',
  'linear-gradient(0deg, #e6e9f0 0%,#eef1f5 100%)',
  'linear-gradient(0deg, #accbee 0%,#e7f0fd 100%)',
  'linear-gradient(-20deg, #e9defa 0%,#fbfcdb 100%)',
  'linear-gradient(0deg, #c1dfc4 0%,#deecdd 100%)',
  'linear-gradient(0deg, #0ba360 0%,#3cba92 100%)',
  'linear-gradient(0deg, #00c6fb 0%,#005bea 100%)',
  'linear-gradient(0deg, #74ebd5 0%,#9face6 100%)',
  'linear-gradient(0deg, #6a85b6 0%,#bac8e0 100%)',
  'linear-gradient(0deg, #a3bded 0%,#6991c7 100%)',
  'linear-gradient(0deg, #9795f0 0%,#fbc8d4 100%)',
  'linear-gradient(0deg, #a7a6cb 0%,#8989ba 52%,#8989ba 100%)',
  'linear-gradient(0deg, #3f51b1 0%,#5a55ae 13%,#7b5fac 25%,#8f6aae 38%,#a86aa4 50%,#cc6b8e 62%,#f18271 75%,#f3a469 87%,#f7c978 100%)',
  'linear-gradient(0deg, #fcc5e4 0%,#fda34b 15%,#ff7882 35%,#c8699e 52%,#7046aa 71%,#0c1db8 87%,#020f75 100%)',
  'linear-gradient(0deg, #dbdcd7 0%,#dddcd7 24%,#e2c9cc 30%,#e7627d 46%,#b8235a 59%,#801357 71%,#3d1635 84%,#1c1a27 100%)',
  'linear-gradient(0deg, #f43b47 0%,#453a94 100%)',
  'linear-gradient(0deg, #4fb576 0%,#44c489 30%,#28a9ae 46%,#28a2b7 59%,#4c7788 71%,#6c4f63 80%,#432c39 100%)',
  'linear-gradient(0deg, #0250c5 0%,#d43f8d 100%)',
  'linear-gradient(0deg, #88d3ce 0%,#6e45e2 100%)',
  'linear-gradient(0deg, #d9afd9 0%,#97d9e1 100%)',
  'linear-gradient(0deg, #7028e4 0%,#e5b2ca 100%)',
  'linear-gradient(15deg, #13547a 0%,#80d0c7 100%)',
  'linear-gradient(0deg, #BDBBBE 0%,#9D9EA3 100%)',
  'linear-gradient(0deg, #505285 0%,#585e92 12%,#65689f 25%)',
  'linear-gradient(0deg, #ff0844 0%,#ffb199 100%)',
  'linear-gradient(45deg, #93a5cf 0%,#e4efe9 100%)',
  'linear-gradient(0deg, #434343 0%,#000000 100%)',
  'linear-gradient(0deg, #0c3483 0%,#a2b6df 100%,#6b8cce 100%)',
  'linear-gradient(45deg, #93a5cf 0%,#e4efe9 100%)',
  'linear-gradient(0deg, #92fe9d 0%,#00c9ff 100%)',
  'linear-gradient(0deg, #ff758c 0%,#ff7eb3 100%)',
  'linear-gradient(0deg, #868f96 0%,#596164 100%)',
  'linear-gradient(0deg, #c79081 0%,#dfa579 100%)',
  'linear-gradient(45deg, #8baaaa 0%,#ae8b9c 100%)',
  'linear-gradient(0deg, #f83600 0%,#f9d423 100%)',
  'linear-gradient(-20deg, #b721ff 0%,#21d4fd 100%)',
  'linear-gradient(-20deg, #6e45e2 0%,#88d3ce 100%)',
  'linear-gradient(-20deg, #d558c8 0%,#24d292 100%)',
  'linear-gradient(60deg, #abecd6 0%,#fbed96 100%)',
  'linear-gradient(0deg, #d5d4d0 0%,#d5d4d0 1%,#eeeeec 31%)',
  'linear-gradient(0deg, #5f72bd 0%,#9b23ea 100%)',
  'linear-gradient(0deg, #09203f 0%,#537895 100%)',
  'linear-gradient(-20deg, #ddd6f3 0%,#faaca8 100%,#faaca8 100%)',
  'linear-gradient(-20deg, #dcb0ed 0%,#99c99c 100%)',
  'linear-gradient(0deg, #f3e7e9 0%,#e3eeff 99%,#e3eeff 100%)',
  'linear-gradient(0deg, #c71d6f 0%,#d09693 100%)',
  'linear-gradient(60deg, #96deda 0%,#50c9c3 100%)',
  'linear-gradient(0deg, #f77062 0%,#fe5196 100%)',
  'linear-gradient(0deg, #c4c5c7 0%,#dcdddf 52%,#ebebeb 100%)',
  'linear-gradient(0deg, #a8caba 0%,#5d4157 100%)',
  'linear-gradient(60deg, #29323c 0%,#485563 100%)',
  'linear-gradient(-60deg, #16a085 0%,#f4d03f 100%)',
  'linear-gradient(-60deg, #ff5858 0%,#f09819 100%)',
  'linear-gradient(-20deg, #2b5876 0%,#4e4376 100%)',
  'linear-gradient(-20deg, #00cdac 0%,#8ddad5 100%)',
  'linear-gradient(-180deg, #BCC5CE 0%,#929EAD 98%)',
  'linear-gradient(0deg, #4481eb 0%,#04befe 100%)',
  'linear-gradient(0deg, #dad4ec 0%,#dad4ec 1%,#f3e7e9 100%)',
  'linear-gradient(45deg, #874da2 0%,#c43a30 100%)',
  'linear-gradient(0deg, #4481eb 0%,#04befe 100%)',
  'linear-gradient(0deg, #e8198b 0%,#c7eafd 100%)',
  'linear-gradient(0deg, #EADFDF 59%,#ECE2DF 100%)',
  'linear-gradient(-20deg, #f794a4 0%,#fdd6bd 100%)',
  'linear-gradient(60deg, #64b3f4 0%,#c2e59c 100%)',
  'linear-gradient(0deg, #3b41c5 0%,#a981bb 49%,#ffc8a9 100%)',
  'linear-gradient(0deg, #0fd850 0%,#f9f047 100%)',
  'linear-gradient(0deg, #d3d3d3 0%,#d3d3d3 1%,#e0e0e0 26%)',
  'linear-gradient(45deg, #ee9ca7 0%,#ffdde1 100%)',
  'linear-gradient(0deg, #3ab5b0 0%,#3d99be 31%,#56317a 100%)',
  'linear-gradient(0deg, #209cff 0%,#68e0cf 100%)',
  'linear-gradient(0deg, #bdc2e8 0%,#bdc2e8 1%,#e6dee9 100%)',
  'linear-gradient(0deg, #e6b980 0%,#eacda3 100%)',
  'linear-gradient(0deg, #1e3c72 0%,#1e3c72 1%,#2a5298 100%)',
  'linear-gradient(0deg, #d5dee7 0%,#ffafbd 0%,#c9ffbf 100%)',
  'linear-gradient(0deg, #9be15d 0%,#00e3ae 100%)',
  'linear-gradient(0deg, #ed6ea0 0%,#ec8c69 100%)',
  'linear-gradient(0deg, #ffc3a0 0%,#ffafbd 100%)',
  'linear-gradient(0deg, #cc208e 0%,#6713d2 100%)',
  'linear-gradient(0deg, #b3ffab 0%,#12fff7 100%)',
  'linear-gradient(0deg, #D5DEE7 0%,#E8EBF2 50%,#E2E7ED 100%)',
  'linear-gradient(0deg, #65bd60 0%,#5ac1a8 25%,#3ec6ed 50%)',
  'linear-gradient(0deg, #243949 0%,#517fa4 100%)',
  'linear-gradient(-20deg, #fc6076 0%,#ff9a44 100%)',
  'linear-gradient(0deg, #dfe9f3 0%,#ffffff 100%)',
  'linear-gradient(0deg, #00dbde 0%,#fc00ff 100%)',
  'linear-gradient(0deg, #f9d423 0%,#ff4e50 100%)',
  'linear-gradient(0deg, #50cc7f 0%,#f5d100 100%)',
  'linear-gradient(0deg, #0acffe 0%,#495aff 100%)',
  'linear-gradient(-20deg, #616161 0%,#9bc5c3 100%)',
  'linear-gradient(60deg, #3d3393 0%,#2b76b9 37%,#2cacd1 65%,#35eb93 100%)',
  'linear-gradient(0deg, #df89b5 0%,#bfd9fe 100%)',
  'linear-gradient(0deg, #ed6ea0 0%,#ec8c69 100%)',
  'linear-gradient(0deg, #d7d2cc 0%,#304352 100%)',
  'linear-gradient(0deg, #e14fad 0%,#f9d423 100%)',
  'linear-gradient(0deg, #b224ef 0%,#7579ff 100%)',
  'linear-gradient(0deg, #c1c161 0%,#c1c161 0%,#d4d4b1 100%)',
  'linear-gradient(0deg, #ec77ab 0%,#7873f5 100%)',
  'linear-gradient(0deg, #007adf 0%,#00ecbc 100%)',
  'linear-gradient(-225deg, #20E2D7 0%,#F9FEA5 100%)',
  'linear-gradient(-225deg, #2CD8D5 0%,#C5C1FF 56%,#FFBAC3 100%)',
  'linear-gradient(-225deg, #2CD8D5 0%,#6B8DD6 48%,#8E37D7 100%)',
  'linear-gradient(-225deg, #DFFFCD 0%,#90F9C4 48%,#39F3BB 100%)',
  'linear-gradient(-225deg, #5D9FFF 0%,#B8DCFF 48%,#6BBBFF 100%)',
  'linear-gradient(-225deg, #A8BFFF 0%,#884D80 100%)',
  'linear-gradient(-225deg, #5271C4 0%,#B19FFF 48%,#ECA1FE 100%)',
  'linear-gradient(-225deg, #FFE29F 0%,#FFA99F 48%,#FF719A 100%)',
  'linear-gradient(-225deg, #22E1FF 0%,#1D8FE1 48%,#625EB1 100%)',
  'linear-gradient(-225deg, #B6CEE8 0%,#F578DC 100%)',
  'linear-gradient(-225deg, #FFFEFF 0%,#D7FFFE 100%)',
  'linear-gradient(-225deg, #E3FDF5 0%,#FFE6FA 100%)',
  'linear-gradient(-225deg, #7DE2FC 0%,#B9B6E5 100%)',
  'linear-gradient(-225deg, #CBBACC 0%,#2580B3 100%)',
  'linear-gradient(-225deg, #B7F8DB 0%,#50A7C2 100%)',
  'linear-gradient(-225deg, #7085B6 0%,#87A7D9 50%,#DEF3F8 100%)',
  'linear-gradient(-225deg, #77FFD2 0%,#6297DB 48%,#1EECFF 100%)',
  'linear-gradient(-225deg, #AC32E4 0%,#7918F2 48%,#4801FF 100%)',
  'linear-gradient(-225deg, #D4FFEC 0%,#57F2CC 48%,#4596FB 100%)',
  'linear-gradient(-225deg, #9EFBD3 0%,#57E9F2 48%,#45D4FB 100%)',
  'linear-gradient(-225deg, #473B7B 0%,#3584A7 51%,#30D2BE 100%)',
  'linear-gradient(-225deg, #65379B 0%,#886AEA 53%,#6457C6 100%)',
  'linear-gradient(-225deg, #A445B2 0%,#D41872 52%,#FF0066 100%)',
  'linear-gradient(-225deg, #7742B2 0%,#F180FF 52%,#FD8BD9 100%)',
  'linear-gradient(-225deg, #FF3CAC 0%,#562B7C 52%,#2B86C5 100%)',
  'linear-gradient(-225deg, #FF057C 0%,#8D0B93 50%,#321575 100%)',
  'linear-gradient(-225deg, #FF057C 0%,#7C64D5 48%,#4CC3FF 100%)',
  'linear-gradient(-225deg, #69EACB 0%,#EACCF8 48%,#6654F1 100%)',
  'linear-gradient(-225deg, #231557 0%,#44107A 29%,#FF1361 67%)',
  'linear-gradient(-225deg, #3D4E81 0%,#5753C9 48%,#6E7FF3 100%)'
]
