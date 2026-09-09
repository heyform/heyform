const FORM_INTERFACES = `
Field kind values:
- group, welcome, thank_you, statement
- short_text, long_text, number, yes_no
- multiple_choice, picture_choice, file_upload
- opinion_scale, rating, date, date_range, time
- input_table, payment, full_name, address, email, url
- phone_number, country_selector, signature, legal_terms

Field JSON shape:
{
  "id": "12-character id",
  "title": ["Question title"],
  "description": [],
  "kind": "short_text",
  "validations": {},
  "properties": {},
  "layout": null
}
Use only the keys shown above for fields. Use unique, nonempty IDs for fields and choices.
Title and description must be rich-text arrays, e.g. ["Plain text"].
Formatted nodes use ["tag", ["text or nested nodes"], {"attribute": "value"}],
e.g. [["a", ["Website"], {"href": "https://example.com"}]]. Attributes must be objects,
never a URL string; prefer plain text when formatting is unnecessary.
Put legal terms text in description. Never use properties.html, placeholder, or helpText.
Validations may only contain required (boolean), min/max (number), matchExpected (boolean).
Properties may contain only these keys, when relevant to the field kind:
- showButton, hideMarks, allowOther, allowMultiple, verticalAlignment, randomize,
  allowTime, use12Hours, redirectOnCompletion: booleans
- buttonText, badge, choiceStyle, other, shape, leftLabel, centerLabel, rightLabel,
  defaultCountryCode, currency, format, sourceUrl, buttonLinkUrl, redirectUrl: strings
- numberPreRow, total, start, score, redirectDelay: numbers
- choices: [{"id":"unique id","label":"Choice text"}], optionally image/color (string),
  score (number), isExpected (boolean)
- tableColumns: [{"id":"unique id","label":"Column text","type":"text","required":false}]
- price: {"type":"number","value":10} or {"type":"variable","ref":"variable id"}
- fields: an array of child fields using the same field shape (for groups)
Layout must be null or an object with mediaType (image/video), mediaUrl,
backgroundColor, brightness (number between -100 and 100), align
(inline/float_left/float_right/split_left/split_right/cover).
Do not invent properties or put field content in unknown keys.
`

const LOGIC_INTERFACES = `
Logic JSON shape:
[
  {
    "fieldId": "field id",
    "payloads": [
      {
        "id": "12-character id",
        "condition": {
          "comparison": "is",
          "expected": "value"
        },
        "action": {
          "kind": "navigate",
          "fieldId": "target field id"
        }
      }
    ]
  }
]

Supported comparisons include is, is_not, contains, does_not_contain, starts_with,
ends_with, equal, not_equal, greater_than, less_than, greater_or_equal_than,
less_or_equal_than, is_before, is_after, is_empty, and is_not_empty.
Supported action kinds are navigate and calculate.
`

export function createFormPrompt(topic: string, reference?: string): string {
  return `
${FORM_INTERFACES}

Create a form for this request:
${topic}

${
  reference
    ? `Use this reference material when helpful:
${reference}`
    : ''
}

Return only JSON. Do not output markdown or explanation.
Generate 5 to 20 fields. Match the language of the request.
Use this exact JSON shape:
{
  "name": "form name",
  "fields": [
    {
      "id": "2sgLirFD41ZP",
      "title": ["title here"],
      "description": [],
      "kind": "short_text",
      "validations": {},
      "properties": {},
      "layout": null
    }
  ]
}
`
}

export function createFieldsPrompt(name: string, questions: unknown, prompt: string): string {
  return `
${FORM_INTERFACES}

The form name is:
${name}

The current questions are:
${JSON.stringify(questions)}

User request:
${prompt}

Return only JSON. Do not output markdown or explanation.
Only edit specified questions, insert/create new questions at requested locations, or reorder questions.
If new questions are created without a specified position, place them at the end.
Match the language of the request.
Return a JSON array of fields.
`
}

export function createLogicsPrompt(questions: unknown, logics: unknown, prompt: string): string {
  return `
${FORM_INTERFACES}
${LOGIC_INTERFACES}

The current questions are:
${JSON.stringify(questions)}

The existing logics are:
${JSON.stringify(logics || [])}

User request:
${prompt}

Return only JSON. Do not output markdown or explanation.
Only add, modify, or delete logic for specified questions.
Return all logics as a JSON array.
`
}

export function createThemePrompt(theme: string, prompt: string): string {
  return `
Allowed Google fonts:
Inter, Public Sans, Montserrat, Alegreya, B612, Muli, Titillium Web, Varela,
Vollkorn, IBM Plex Mono, Crimson Text, Cairo, BioRhyme, Karla, Lora,
Frank Ruhl Libre, Playfair Display, Archivo, Spectral, Fjalla One, Roboto,
Rubik, Source Sans Pro, Cardo, Cormorant, Work Sans, Rakkas, Concert One,
Yatra One, Arvo, Lato, Abril Fatface, Ubuntu, PT Serif, Old Standard TT,
Oswald, Open Sans, Courier Prime, Poppins, Josefin Sans, Fira Sans, Nunito,
Exo 2, Merriweather, Noto Sans.

Current theme:
${theme}

User request:
${prompt}

Return only JSON. Do not output markdown or explanation.
Create or edit the theme using this JSON shape:
{
  "fontFamily": "Inter",
  "questionTextColor": "#000000",
  "answerTextColor": "#000000",
  "buttonBackground": "#000000",
  "buttonTextColor": "#ffffff",
  "backgroundColor": "#ffffff"
}
`
}
