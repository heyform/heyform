import { flattenFieldsWithGroups } from '@heyform-inc/form-renderer'
import {
  ActionEnum,
  ComparisonEnum,
  FieldKindEnum,
  Logic,
  LogicPayload,
  NavigateAction,
  UNSELECTABLE_FIELD_KINDS
} from '@heyform-inc/shared-types-enums'
import * as dagre from 'dagre'
import { Edge, Node } from 'react-flow-renderer'

import {
  BRANCHING_CHOICE_FIELD_KINDS,
  createFieldNavigation,
  getChoiceBranchingErrors,
  getPayloadChoiceId,
  isChoiceBranchingField
} from '@heyform-inc/answer-utils'
import { nanoid } from '@heyform-inc/utils'

import { FormFieldType } from '@/types'

const nodeWidth = 224
const nodeHeight = 112

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
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

  let prevThankYouNode: Node | undefined = undefined

  nodes.forEach(node => {
    const position = dagreGraph.node(node.id)

    node.position = {
      x: position.x - nodeWidth / 2,
      y: position.y - nodeHeight / 2
    }

    if (node.data.field.kind === FieldKindEnum.THANK_YOU) {
      if (prevThankYouNode) {
        node.position = {
          x: prevThankYouNode.position.x,
          y: prevThankYouNode.position.y + nodeHeight + 24
        }
      }

      prevThankYouNode = node
    }

    return node
  })

  return { nodes, edges }
}

export function getValidLogics(fields: FormFieldType[], logics?: Logic[]): Logic[] {
  const fieldIds = flattenFieldsWithGroups(fields).map(f => f.id)
  return logics?.filter(l => fieldIds.includes(l.fieldId)) || []
}

// Map each option of a branching choice question to the destination of its "is <option>" jump.
export function getChoiceDestinations(payloads: LogicPayload[] = []): Record<string, string> {
  const destinations: Record<string, string> = {}

  for (const payload of payloads) {
    const choiceId = getPayloadChoiceId(payload)

    if (payload.action.kind === ActionEnum.NAVIGATE && choiceId && !(choiceId in destinations)) {
      destinations[choiceId] = (payload.action as NavigateAction).fieldId
    }
  }

  return destinations
}

export function canBranchByAnswer(field: FormFieldType): boolean {
  return BRANCHING_CHOICE_FIELD_KINDS.includes(field.kind)
}

// Jumps that aren't a single-option "is" rule can't be shown per answer, so branching drops them.
export function countUnmappedJumps(field: FormFieldType, payloads: LogicPayload[] = []): number {
  const choiceIds = (field.properties?.choices || []).map(c => c.id)

  return payloads.filter(p => {
    const choiceId = getPayloadChoiceId(p)
    return p.action.kind === ActionEnum.NAVIGATE && (!choiceId || !choiceIds.includes(choiceId))
  }).length
}

export function getPayloadFormValues(field: FormFieldType, logic?: Logic) {
  const payloads = logic?.payloads || []

  if (!canBranchByAnswer(field)) {
    return { payloads, nextFieldId: field.nextFieldId || '' }
  }

  const branching = isChoiceBranchingField(field, logic)

  return {
    // A branching question jumps via its per-answer destinations, so the rule list keeps the rest.
    payloads: branching ? payloads.filter(p => p.action.kind !== ActionEnum.NAVIGATE) : payloads,
    nextFieldId: field.nextFieldId || '',
    branching,
    destinations: getChoiceDestinations(payloads)
  }
}

export function toChoiceBranchPayloads(
  field: FormFieldType,
  destinations: Record<string, string>,
  previous: LogicPayload[] = []
): LogicPayload[] {
  return (field.properties?.choices || []).map(choice => ({
    // Keep payload IDs stable so flow edges don't churn between saves.
    id:
      previous.find(
        p => p.action.kind === ActionEnum.NAVIGATE && getPayloadChoiceId(p) === choice.id
      )?.id || nanoid(12),
    condition: { comparison: ComparisonEnum.IS, expected: choice.id },
    action: { kind: ActionEnum.NAVIGATE, fieldId: destinations[choice.id] }
  })) as LogicPayload[]
}

export function fieldLogicToNodesEdges(
  rawFields: FormFieldType[],
  logics?: Logic[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const fields = flattenFieldsWithGroups(rawFields)
  const navigation = createFieldNavigation(fields)
  const invalidBranchingIds = new Set(getChoiceBranchingErrors(fields, logics).map(e => e.fieldId))

  fields.forEach((field, index) => {
    const hasBranchingError = invalidBranchingIds.has(field.id)
    const isBranching = isChoiceBranchingField(
      field,
      logics?.find(l => l.fieldId === field.id)
    )

    nodes.push({
      id: field.id,
      type: 'customNode',
      data: {
        field,
        isFirstField: index === 0,
        isLastField: index === fields.length - 1,
        isBranching,
        hasBranchingError
      },
      position: {
        x: 0,
        y: 0
      },
      connectable: true,
      selectable:
        field.kind === FieldKindEnum.STATEMENT || !UNSELECTABLE_FIELD_KINDS.includes(field.kind)
    })

    const targetId = navigation.getNextFieldId(field.id)

    // A complete per-answer branch leaves no path to the default next question.
    if (targetId && (!isBranching || hasBranchingError)) {
      const fieldId = field.id

      edges.push({
        id: `next-${fieldId}`,
        source: fieldId,
        target: targetId,
        data: { kind: 'next' },
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

        if (!fields.some(f => f.id === fieldId) || !fields.some(f => f.id === targetId)) {
          return
        }

        edges.push({
          id: payload.id,
          source: fieldId,
          target: targetId,
          data: { kind: 'conditional' },
          style: {
            stroke: '#1f2937',
            strokeDasharray: '4 4'
          },
          markerEnd: 'edge-marker-arrow'
        })
      }
    })
  })

  return getLayoutedElements(nodes, edges)
}
