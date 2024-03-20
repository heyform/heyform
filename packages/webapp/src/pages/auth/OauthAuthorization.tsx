import { FC, useState } from 'react'

import { Async } from '@/components'
import { Button, Spin, notification } from '@/components/ui'
import { AppModel } from '@/models'
import { Summary } from '@/pages/form/Integration/views/Settings/views/Summary'
import { AppService } from '@/service'
import { useQuery } from '@/utils'

const OauthAuthorization: FC = () => {
  const { client_id, redirect_uri, state } = useQuery()

  const [app, setApp] = useState<AppModel | undefined>()
  const [loading, setLoading] = useState(false)

  async function fetchAppDetail() {
    const res = await AppService.detail(client_id, redirect_uri)
    setApp(res)
    return true
  }

  async function handleAuthorize() {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      const res = await AppService.authorizationCode(client_id, redirect_uri)
      window.location.href = `${res}&state=${state}`
    } catch (err: any) {
      notification.error({
        title: 'Authorize failed'
      })
    }

    setLoading(false)
  }

  return (
    <Async request={fetchAppDetail} skeleton={<Spin />}>
      <div
        className="flex flex-col justify-center"
        style={{ width: '540px', margin: 'auto', height: '100%' }}
      >
        <Summary app={app} />
        <div className="mb-16 bg-[#fafbfc] p-9">
          <div className="mb-9 text-center text-[20px] text-[#4e5d78]">
            {app?.name} would like to:
          </div>

          <div className="mb-10">
            <div className="mb-4">
              <div className="text-[#4e5d78]">Workspace Read</div>
              <div className="mt-1 text-[13px] text-[#8a94a6]">
                Retrieve data about all the workspaces in your HeyForm account
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[#4e5d78]">Project Read</div>
              <div className="mt-1 text-[13px] text-[#8a94a6]">
                Retrieve data about all the project in your HeyForm workspace
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[#4e5d78]">Form Read</div>
              <div className="mt-1 text-[13px] text-[#8a94a6]">
                Retrieve data about all the forms in your HeyForm project
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[#4e5d78]">Submission Read</div>
              <div className="mt-1 text-[13px] text-[#8a94a6]">
                Retrieve form submissions you collected
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[#4e5d78]">Accounts Read</div>
              <div className="mt-1 text-[13px] text-[#8a94a6]">
                Retrieve your HeyForm account information
              </div>
            </div>
          </div>
          <Button type="primary" loading={loading} block={true} onClick={handleAuthorize}>
            Authorize
          </Button>
        </div>
      </div>
    </Async>
  )
}

export default OauthAuthorization
