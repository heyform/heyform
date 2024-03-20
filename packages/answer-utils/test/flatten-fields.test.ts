import { flattenFields } from '../src'
import fields from './fixtures/fields.json'

test('should flatten fields', () => {
  expect(flattenFields(fields as any)).toMatchSnapshot()
})

test('should flatten fields with group', () => {
  const rawFields: any[] = [
    {
      properties: {
        fields: [
          {
            id: 'sub1',
            kind: 'multiple_choice'
          }
        ]
      },
      id: 'grp1',
      kind: 'group'
    },
    {
      id: 'txt1',
      kind: 'text'
    }
  ]

  expect(flattenFields(rawFields).map(f => f.id)).toStrictEqual(['sub1', 'txt1'])
  expect(flattenFields(rawFields, true).map(f => f.id)).toStrictEqual(['grp1', 'sub1', 'txt1'])
})
