export enum InteractiveModeEnum {
  GENERAL = 1,
  INTERACTIVE,
  POPUP
}

export enum FormKindEnum {
  SURVEY = 1,
  QUIZ,
  CONTACT
}

export enum FormStatusEnum {
  NORMAL = 1,
  TRASH
}

export enum CaptchaKindEnum {
  NONE = 0,
  GOOGLE_RECAPTCHA,
  GEETEST_CAPTCHA
}

export enum FieldKindEnum {
  GROUP = 'group',

  // Statement
  WELCOME = 'welcome',
  THANK_YOU = 'thank_you',
  STATEMENT = 'statement',

  // Input
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',

  // Select
  YES_NO = 'yes_no',
  MULTIPLE_CHOICE = 'multiple_choice',
  PICTURE_CHOICE = 'picture_choice',

  // File
  FILE_UPLOAD = 'file_upload',

  // Rating
  OPINION_SCALE = 'opinion_scale',
  RATING = 'rating',

  // Picker
  DATE = 'date',
  DATE_RANGE = 'date_range',
  TIME = 'time',

  // Data
  INPUT_TABLE = 'input_table',

  // Fieldset
  PAYMENT = 'payment',
  FULL_NAME = 'full_name',
  ADDRESS = 'address',
  EMAIL = 'email',
  URL = 'url',
  PHONE_NUMBER = 'phone_number',
  COUNTRY = 'country_selector',
  SIGNATURE = 'signature',
  LEGAL_TERMS = 'legal_terms',

  // HeySheet custom columns
  CUSTOM_TEXT = 'custom_text',
  CUSTOM_SINGLE = 'custom_single',
  CUSTOM_MULTIPLE = 'custom_multiple',
  CUSTOM_DATE = 'custom_date',
  CUSTOM_NUMBER = 'custom_number',
  CUSTOM_CHECKBOX = 'custom_checkbox'
}

export enum FieldLayoutAlignEnum {
  INLINE = 'inline',
  FLOAT_LEFT = 'float_left',
  FLOAT_RIGHT = 'float_right',
  SPLIT_LEFT = 'split_left',
  SPLIT_RIGHT = 'split_right',
  COVER = 'cover'
}

export enum ComparisonEnum {
  IS = 'is',
  IS_NOT = 'is_not',
  CONTAINS = 'contains',
  DOES_NOT_CONTAIN = 'does_not_contain',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',

  // Number
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL_THAN = 'greater_or_equal_than',
  LESS_OR_EQUAL_THAN = 'less_or_equal_than',

  // Date
  IS_BEFORE = 'is_before',
  IS_AFTER = 'is_after',

  // Common
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty'
}

export enum CalculateEnum {
  ADDITION = 'addition',
  SUBTRACTION = 'subtraction',
  MULTIPLICATION = 'multiplication',
  DIVISION = 'division',
  ASSIGNMENT = 'assignment'
}

export enum ActionEnum {
  NAVIGATE = 'navigate',
  CALCULATE = 'calculate'
}
