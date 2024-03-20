import { helper } from '@heyform-inc/utils'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'

import { WorkspaceService } from '@/service'
import { useStore } from '@/store'
import { useAsyncEffect, useQuery, useQueryURL, useRouter } from '@/utils'

const INVITATION_REGEX = /\/workspace\/[^\/]+\/invitation\/[^\/]+/i

const Home: FC = observer(() => {
  const router = useRouter()
  const query = useQuery()
  const workspaceStore = useStore('workspaceStore')
  const nextURL = useQueryURL('/workspace/create')

  useAsyncEffect(async () => {
    let list = workspaceStore.list
    const currentWorkspaceId = workspaceStore.currentWorkspaceId
    const redirectUri = query.redirect_uri

    if (INVITATION_REGEX.test(redirectUri)) {
      return router.redirect(redirectUri)
    }

    if (helper.isEmpty(list)) {
      const result = await WorkspaceService.workspaces()
      workspaceStore.setWorkspaces(result)

      if (helper.isEmpty(result)) {
        return router.redirect(nextURL)
      }

      list = result
    }

    if (helper.isValid(redirectUri)) {
      return router.redirect(redirectUri)
    }

    let workspaceId = list![0].id

    if (helper.isValid(currentWorkspaceId)) {
      const index = list!.findIndex(row => row.id === workspaceId)

      if (index > -1) {
        workspaceId = currentWorkspaceId!
      }
    }

    // Navigate to last visited workspace
    router.replace(`/workspace/${workspaceId}`)
  }, [workspaceStore.list])

  return <></>
})

export default Home
