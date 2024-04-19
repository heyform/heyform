import { ActionEnum, FormField, Logic } from '@heyform-inc/shared-types-enums'
import * as dagre from 'dagre'
import { Edge, Node } from 'react-flow-renderer'

import { UNSELECTABLE_FIELD_KINDS } from '@/pages/form/Create/views/FieldConfig'
import { flattenFieldsWithGroups } from '@/pages/form/views/FormComponents'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 224
const nodeHeight = 112

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  dagreGraph.setGraph({
    rankdir: direction
  })

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach(node => {
    const position = dagreGraph.node(node.id)

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: position.x - nodeWidth / 2,
      y: position.y - nodeHeight / 2
    }

    return node
  })

  return { nodes, edges }
}

export function getValidLogics(fields: FormField[], logics?: Logic[]): Logic[] {
  const fieldIds = flattenFieldsWithGroups(fields).map(f => f.id)
  return logics?.filter(l => fieldIds.includes(l.fieldId)) || []
}

export function fieldLogicToNodesEdges(
  rawFields: FormField[],
  logics?: Logic[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const fields = flattenFieldsWithGroups(rawFields)

  fields.forEach((field, index) => {
    nodes.push({
      id: field.id,
      type: 'customNode',
      data: {
        field,
        isFirstField: index === 0,
        isLastField: index === fields.length - 1
      },
      position: {
        x: 0,
        y: 0
      },
      connectable: true,
      selectable: !UNSELECTABLE_FIELD_KINDS.includes(field.kind)
    })

    if (index < fields.length - 1) {
      const nextField = fields[index + 1]
      const fieldId = field.id
      const targetId = nextField.id

      edges.push({
        id: `${fieldId}-${targetId}`,
        source: fieldId,
        target: targetId,
        style: {
          stroke: '#1f2937'
        },
        markerEnd: 'edge-marker-arrow'
      })
    }
  })

  logics?.forEach(logic => {
    const { fieldId, payloads } = logic

    payloads.forEach(payload => {
      if (payload.action.kind === ActionEnum.NAVIGATE) {
        const targetId = payload.action.fieldId

        edges.push({
          type: 'customEdge',
          id: payload.id,
          source: fieldId,
          target: targetId,
          style: {
            stroke: '#1f2937'
          },
          markerEnd: 'edge-marker-arrow'
        })
      }
    })
  })

  return getLayoutedElements(nodes, edges)
}
