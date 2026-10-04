import { flattenFieldsWithGroups } from '@heyform-inc/form-renderer'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { memo, useMemo } from 'react'
import { Connection, Handle, Node, Position } from 'react-flow-renderer'

import { isValidNextFieldId } from '@heyform-inc/answer-utils'
import { htmlUtils } from '@heyform-inc/answer-utils'

import { FormFieldType } from '@/types'

import { QuestionIcon } from '../LeftSidebar/QuestionList'
import { useStoreContext } from '../store'

interface CustomNodeProps extends Node {
  data: {
    field: FormFieldType
    isFirstField: boolean
    isLastField: boolean
  }
}

const CustomNodeComponent: FC<CustomNodeProps> = ({ data: { field, isFirstField } }) => {
  const { state } = useStoreContext()

  function isValidConnection(connection: Connection) {
    return !!(
      connection.source &&
      connection.target &&
      isValidNextFieldId(
        flattenFieldsWithGroups(state.fields),
        connection.source,
        connection.target
      )
    )
  }

  const TargetHandle = useMemo(() => {
    if (isFirstField || field.kind === FieldKindEnum.WELCOME) {
      return null
    }

    return (
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={true}
        isValidConnection={isValidConnection}
      />
    )
  }, [field.kind, isFirstField, state.fields])

  const SourceHandle = useMemo(() => {
    if (field.kind === FieldKindEnum.THANK_YOU) {
      return null
    }

    return (
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={![FieldKindEnum.WELCOME, FieldKindEnum.GROUP].includes(field.kind)}
        isValidConnection={isValidConnection}
      />
    )
  }, [field.kind, state.fields])

  return (
    <div className="flow-custom-node">
      {TargetHandle}
      <div className="flow-custom-node-content">
        <QuestionIcon kind={field.kind} index={field.index} parentIndex={field.parent?.index} />
        <div className="flow-custom-node-title">{htmlUtils.plain(field.title as string)}</div>
      </div>
      {SourceHandle}
    </div>
  )
}

export const CustomNode = memo(CustomNodeComponent)
