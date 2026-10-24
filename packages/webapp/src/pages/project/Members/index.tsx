import { Navigate } from 'react-router-dom'

import { useParam } from '@/utils'

export default function ProjectMembers() {
  const { workspaceId, projectId } = useParam()

  return (
    <Navigate
      to={`/workspace/${workspaceId}/project/${projectId}/`}
      replace
      state={{ isMembersModalOpen: true }}
    />
  )
}
