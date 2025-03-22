import { IconCircleCheck } from '@tabler/icons-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components'
import { useUserStore } from '@/store'
import { useParam, useRouter } from '@/utils'

export default function BillingSuccess() {
  const { t } = useTranslation()

  const router = useRouter()
  const { workspaceId } = useParam()
  const { user } = useUserStore()

  useEffect(() => {
    if (user?.email && window.TrackdeskObject) {
      window.TrackdeskObject.f('heyform', 'externalCid', {
        externalCid: user.email,
        revenueOriginId: '6f6a669c-f8ee-427e-abad-d20bef6be5bf'
      })
    }
  }, [user?.email])

  return (
    <EmptyState
      icon={<IconCircleCheck className="h-20 w-20 text-green-500" stroke={1.5} />}
      headline={t('billing.success.title')}
      subHeadline={t('billing.success.description')}
      buttonTitle={t('billing.success.button')}
      onClick={() => router.replace(`/workspace/${workspaceId}`)}
    />
  )
}
