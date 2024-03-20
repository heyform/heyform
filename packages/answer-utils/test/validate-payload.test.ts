import { validatePayload } from '../src/validate-payload'
import {
  ActionEnum,
  CalculateEnum,
  ComparisonEnum,
  type LogicPayload
} from '@heyform-inc/shared-types-enums'

test('validate navigate payload', () => {
  const payloads: LogicPayload[] = [
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        kind: ActionEnum.NAVIGATE,
        fieldId: 'field_id'
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.IS_EMPTY
      },
      action: {
        kind: ActionEnum.NAVIGATE,
        fieldId: 'field_id'
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH
      },
      action: {
        kind: ActionEnum.NAVIGATE,
        fieldId: 'field_id'
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        kind: ActionEnum.NAVIGATE
      }
    } as any,
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.IS_EMPTY
      },
      action: {
        kind: ActionEnum.NAVIGATE
      }
    } as any,
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH
      },
      action: {
        kind: ActionEnum.NAVIGATE,
        fieldId: ''
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        fieldId: 'field_id'
      }
    }
  ]
  const result = payloads.map(validatePayload)

  expect(result).toStrictEqual([true, true, false, false, false, false, false])
})

test('validate calculate payload', () => {
  const payloads: LogicPayload[] = [
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        kind: ActionEnum.CALCULATE,
        variable: 'variable_id',
        operator: CalculateEnum.ADDITION,
        value: 1
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.IS_EMPTY
      },
      action: {
        kind: ActionEnum.CALCULATE,
        variable: 'variable_id',
        operator: CalculateEnum.ADDITION,
        value: 1
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH
      },
      action: {
        kind: ActionEnum.CALCULATE,
        variable: 'variable_id',
        operator: CalculateEnum.ADDITION,
        value: 1
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        kind: ActionEnum.CALCULATE,
        operator: CalculateEnum.ADDITION,
        value: 1
      }
    } as any,
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH,
        expected: 'hello'
      },
      action: {
        kind: ActionEnum.CALCULATE,
        operator: CalculateEnum.ADDITION,
        value: 1
      }
    } as any,
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH
      },
      action: {
        kind: ActionEnum.CALCULATE,
        variable: 'variable_id',
        value: 1
      }
    },
    {
      id: 'p1',
      condition: {
        comparison: ComparisonEnum.ENDS_WITH
      },
      action: {
        kind: ActionEnum.CALCULATE,
        variable: 'variable_id',
        operator: CalculateEnum.ADDITION
      }
    }
  ]
  const result = payloads.map(validatePayload)

  expect(result).toStrictEqual([true, true, false, false, false, false, false])
})
