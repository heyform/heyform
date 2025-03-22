import { ReactFlowProvider } from 'react-flow-renderer'

import IconEdgeArrow from '@/assets/edge-arrow.svg?react'

import { Flow } from './Flow'

export default function LogicFlow() {
  return (
    <div className="logic-flow">
      <IconEdgeArrow className="absolute opacity-0" />
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  )
}
