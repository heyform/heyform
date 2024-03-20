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

export const CUSTOM_COLUMN_CHOICE_KINDS = [
  FieldKindEnum.CUSTOM_SINGLE,
  FieldKindEnum.CUSTOM_MULTIPLE
]

export const CUSTOM_COLUMN_KINDS = [
  ...CUSTOM_COLUMN_CHOICE_KINDS,
  FieldKindEnum.CUSTOM_TEXT,
  FieldKindEnum.CUSTOM_DATE,
  FieldKindEnum.CUSTOM_NUMBER,
  FieldKindEnum.CUSTOM_CHECKBOX
]

export const FORM_FIELD_KINDS = [
  ...QUESTION_FIELD_KINDS,
  ...STATEMENT_FIELD_KINDS
]
