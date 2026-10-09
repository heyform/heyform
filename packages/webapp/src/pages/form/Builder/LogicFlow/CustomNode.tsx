import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { FC } from 'react'
import { memo, useMemo } from 'react'
import { Connection, Handle, Node, Position } from 'react-flow-renderer'
import { useTranslation } from 'react-i18next'

import { htmlUtils } from '@heyform-inc/answer-utils'

import { FormFieldType } from '@/types'

import { QuestionIcon } from '../LeftSidebar/QuestionList'

interface CustomNodeProps extends Node {
  data: {
    field: FormFieldType
    isFirstField: boolean
    isLastField: boolean
    isBranching?: boolean
    hasBranchingError?: boolean
    isValidConnection: (connection: Connection) => boolean
  }
}

const CustomNodeComponent: FC<CustomNodeProps> = ({
  data: { field, isFirstField, isBranching, hasBranchingError, isValidConnection }
}) => {
  const { t } = useTranslation()

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
  }, [field.kind, isFirstField, isValidConnection])

  const SourceHandle = useMemo(() => {
    if (field.kind === FieldKindEnum.THANK_YOU) {
      return null
    }

    return (
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={
          !isBranching && ![FieldKindEnum.WELCOME, FieldKindEnum.GROUP].includes(field.kind)
        }
        isValidConnection={isValidConnection}
      />
    )
  }, [field.kind, isBranching, isValidConnection])

  return (
    <div className="flow-custom-node">
      {TargetHandle}
      <div className="flow-custom-node-content">
        <QuestionIcon kind={field.kind} index={field.index} parentIndex={field.parent?.index} />
        <div className="flow-custom-node-title">{htmlUtils.plain(field.title as string)}</div>
        {hasBranchingError && (
          <IconAlertTriangle
            className="text-error h-5 w-5 shrink-0"
            title={t('form.builder.logic.branching.incomplete')}
          />
        )}
      </div>
      {SourceHandle}
    </div>
  )
}

export const CustomNode = memo(CustomNodeComponent)
