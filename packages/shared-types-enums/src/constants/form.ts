import { FieldKindEnum } from '../enums/form'

export const OTHER_FIELD_KINDS = [
  FieldKindEnum.WELCOME,
  FieldKindEnum.THANK_YOU
]

export const STATEMENT_FIELD_KINDS = [
  FieldKindEnum.STATEMENT,
  ...OTHER_FIELD_KINDS
]

export const QUESTION_FIELD_KINDS = [
  // Group
  FieldKindEnum.GROUP,

  // Input
  FieldKindEnum.SHORT_TEXT,
  FieldKindEnum.LONG_TEXT,
  FieldKindEnum.NUMBER,

  // Select
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,

  // File
  FieldKindEnum.FILE_UPLOAD,

  // Rating
  FieldKindEnum.OPINION_SCALE,
  FieldKindEnum.RATING,

  // Date & Time
  FieldKindEnum.DATE,
  FieldKindEnum.DATE_RANGE,
  FieldKindEnum.TIME,

  // Data
  FieldKindEnum.INPUT_TABLE,

  // Fieldset
  FieldKindEnum.PAYMENT,
  FieldKindEnum.FULL_NAME,
  FieldKindEnum.ADDRESS,
  FieldKindEnum.EMAIL,
  FieldKindEnum.URL,
  FieldKindEnum.PHONE_NUMBER,
  FieldKindEnum.COUNTRY,
  FieldKindEnum.SIGNATURE,
  FieldKindEnum.LEGAL_TERMS
]

export const INPUT_FIELD_KINDS = [
  FieldKindEnum.SHORT_TEXT,
  FieldKindEnum.LONG_TEXT,
  FieldKindEnum.NUMBER,
  FieldKindEnum.EMAIL,
  FieldKindEnum.URL
]

export const CHOICES_FIELD_KINDS = [
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE
]

export const FORM_FIELD_KINDS = [
  ...QUESTION_FIELD_KINDS,
  ...STATEMENT_FIELD_KINDS
]

export const CHOICE_FIELD_KINDS = [
  FieldKindEnum.YES_NO, 
  ...CHOICES_FIELD_KINDS
]

export const RATING_FIELD_KINDS = [
  FieldKindEnum.RATING, 
  FieldKindEnum.OPINION_SCALE
]

export const UNSELECTABLE_FIELD_KINDS = [
  FieldKindEnum.WELCOME,
  FieldKindEnum.THANK_YOU,
  FieldKindEnum.GROUP,
  FieldKindEnum.STATEMENT
]