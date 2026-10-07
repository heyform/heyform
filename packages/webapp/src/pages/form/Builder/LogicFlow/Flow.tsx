import { flattenFieldsWithGroups } from '@heyform-inc/form-renderer'
import { FieldKindEnum, UNSELECTABLE_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { useCallback, useEffect, useMemo } from 'react'
import ReactFlow, {
  Connection,
  ConnectionLineType,
  Controls,
  Node,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'react-flow-renderer'
import { useTranslation } from 'react-i18next'

import { fieldLogicToNodesEdges } from '../utils'
import { createFieldNavigation } from '@heyform-inc/answer-utils'

import { useAppStore } from '@/store'

import { useStoreContext } from '../store'
import { ConnectionLine } from './ConnectionLine'
import { CustomNode } from './CustomNode'

const snapGrid: [number, number] = [16, 16]
const nodeTypes = {
  customNode: CustomNode
}
export const Flow = () => {
  const { t } = useTranslation()
  const { openModal } = useAppStore()
  const { state, dispatch } = useStoreContext()
  const flow = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  function handleInit() {
    setTimeout(() => {
      flow.zoomTo(1, {
        duration: 500
      })
    }, 100)
  }

  function handleNodeClick(_: unknown, node: Node) {
    const { field } = node.data

    if (field.kind === FieldKindEnum.STATEMENT || !UNSELECTABLE_FIELD_KINDS.includes(field.kind)) {
      openModal('LogicModal')
      dispatch({
        type: 'selectField',
        payload: {
          id: field.id,
          parentId: field.parent?.id
        }
      })
    }
  }

  const navigation = useMemo(
    () => createFieldNavigation(flattenFieldsWithGroups(state.fields)),
    [state.fields]
  )
  const isValidConnection = useCallback(
    (connection: Connection) =>
      !!(
        connection.source &&
        connection.target &&
        navigation.isValidNextFieldId(connection.source, connection.target)
      ),
    [navigation]
  )

  function handleConnect(connection: Connection) {
    if (isValidConnection(connection)) {
      dispatch({
        type: 'setNextField',
        payload: { fieldId: connection.source!, nextFieldId: connection.target! }
      })
    }
  }

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = fieldLogicToNodesEdges(
      state.fields,
      state.logics
    )
    setNodes(layoutedNodes.map(node => ({ ...node, data: { ...node.data, isValidConnection } })))
    setEdges(layoutedEdges)
  }, [setEdges, setNodes, state.fields, state.logics, isValidConnection])

  return (
    <ReactFlow
      nodeTypes={nodeTypes as Any}
      nodes={nodes}
      edges={edges}
      connectionLineType={ConnectionLineType.SimpleBezier}
      connectionLineComponent={ConnectionLine}
      snapGrid={snapGrid}
      snapToGrid={true}
      fitView={true}
      fitViewOptions={{ duration: 0 }}
      proOptions={{
        account: 'paid-custom',
        hideAttribution: true
      }}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={handleInit}
      onNodeClick={handleNodeClick}
      onConnect={handleConnect}
      deleteKeyCode={null}
    >
      <Controls showInteractive={false} />
      <div className="text-secondary bg-foreground border-accent-light absolute left-4 top-4 z-10 max-w-sm rounded-lg border p-3 text-xs shadow-sm">
        {String(t('form.builder.logic.nextQuestion.help'))}
      </div>
    </ReactFlow>
  )
}
