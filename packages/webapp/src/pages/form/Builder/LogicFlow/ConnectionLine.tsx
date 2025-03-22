import { type FC, useEffect, useState } from 'react'
import { type ConnectionLineComponentProps, Node, useReactFlow } from 'react-flow-renderer'

function isTargetInNode(targetX: number, targetY: number, node: Node, nodePadding = 8) {
  return (
    targetX >= node.position.x - nodePadding &&
    targetX <= node.position.x + node.width! + nodePadding &&
    targetY >= node.position.y - nodePadding &&
    targetY <= node.position.y + node.height! + nodePadding
  )
}

export const ConnectionLine: FC<ConnectionLineComponentProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceNode
}) => {
  const flow = useReactFlow()
  const [path, setPath] = useState<string>()

  useEffect(() => {
    const nodes = flow.getNodes()
    const node = nodes
      .filter(n => n.id !== sourceNode?.id)
      .find(n => isTargetInNode(targetX, targetY, n))

    if (node) {
      const newTargetX = node.position.x
      const newTargetY = node.position.y + node.height! / 2

      setPath(
        `M${sourceX},${sourceY} C ${sourceX} ${newTargetY} ${sourceX} ${newTargetY} ${newTargetX},${newTargetY}`
      )
    } else {
      setPath(
        `M${sourceX},${sourceY} C ${sourceX} ${targetY} ${sourceX} ${targetY} ${targetX},${targetY}`
      )
    }
  }, [targetX, targetY])

  return (
    <g>
      <path
        className="animated"
        fill="none"
        stroke="#222"
        strokeWidth={2}
        d={path}
        markerEnd="url(#edge-marker-arrow)"
      />
    </g>
  )
}
