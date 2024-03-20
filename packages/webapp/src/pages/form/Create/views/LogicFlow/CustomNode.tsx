import { htmlUtils } from '@heyform-inc/answer-utils'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { memo, useMemo } from 'react'
import { Handle, Node, Position } from 'react-flow-renderer'

import { IFormField } from '@/components/formComponents/typings'

import { FieldKindIcon } from '../LeftSidebar/FieldKindIcon'

interface CustomNodeProps extends Node {
  data: {
    field: IFormField
    isFirstField: boolean
    isLastField: boolean
  }
}

const CustomNodeComponent: FC<CustomNodeProps> = ({
  data: { field, isFirstField, isLastField }
}) => {
  const TargetHandle = useMemo(() => {
    if (isFirstField || field.kind === FieldKindEnum.WELCOME) {
      return null
    }

    return (
      <Handle
        type="target"
        position={Position.Left}
        onConnect={params => console.log('handle onConnect', params)}
        isConnectable={true}
      />
    )
  }, [field.kind])

  const SourceHandle = useMemo(() => {
    if (isLastField || field.kind === FieldKindEnum.THANK_YOU) {
      return null
    }

    return (
      <Handle
        type="source"
        position={Position.Right}
        onConnect={params => console.log('handle onConnect', params)}
        isConnectable={true}
      />
    )
  }, [field.kind])

  return (
    <div className="flow-custom-node">
      {TargetHandle}
      <div className="flow-custom-node-content">
        <FieldKindIcon kind={field.kind} index={field.index} parentIndex={field.parent?.index} />
        <div className="flow-custom-node-title">{htmlUtils.plain(field.title as string)}</div>
      </div>
      {SourceHandle}
    </div>
  )
}

export const CustomNode = memo(CustomNodeComponent)
