import { ReactFlowProvider } from 'react-flow-renderer'

import { EdgeArrow } from '@/components'

import { Flow } from './Flow'

export const LogicFlow = () => {
  return (
    <div className="logic-flow">
      <EdgeArrow />
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  )
}
