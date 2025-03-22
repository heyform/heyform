import { UNSELECTABLE_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { useEffect } from 'react'
import ReactFlow, {
  ConnectionLineType,
  Controls,
  Node,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'react-flow-renderer'

import { useAppStore } from '@/store'

import { useStoreContext } from '../store'
import { fieldLogicToNodesEdges } from '../utils'
import { ConnectionLine } from './ConnectionLine'
import { CustomNode } from './CustomNode'

const snapGrid: [number, number] = [16, 16]
const nodeTypes = {
  customNode: CustomNode
}
const edgeTypes = {
  customEdge: null
}

export const Flow = () => {
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

    if (!UNSELECTABLE_FIELD_KINDS.includes(field.kind)) {
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

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = fieldLogicToNodesEdges(
      state.fields,
      state.logics
    )
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [setEdges, setNodes, state.fields, state.logics])

  return (
    <ReactFlow
      nodeTypes={nodeTypes as Any}
      edgeTypes={edgeTypes as Any}
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
    >
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}
