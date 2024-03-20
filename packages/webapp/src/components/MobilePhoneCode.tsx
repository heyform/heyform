import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, notification } from '@/components/ui'
import { useCaptcha, useCountDown } from '@/utils'

interface MobilePhoneCodeProps extends IComponentProps {
  request: (data: any) => Promise<void>
  onClick: () => Promise<boolean>
}

export const MobilePhoneCode: FC<MobilePhoneCodeProps> = ({
  request,
  style,
  children,
  onClick,
  ...restProps
}) => {
  const { t } = useTranslation()
  const { count, startCountDown } = useCountDown(60)
  const [loading, setLoading] = useState(false)

  async function handleFinish(data: any) {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      await request(data)
      startCountDown()

      notification.success({
        title: t('login.CodeSendSuccess')
      })
    } catch (err: any) {
      notification.error({
        title: t(err.message)
      })
    }

    setLoading(false)
  }

  const handleFinishCallback = useCallback(handleFinish, [request])
  const { showCaptcha } = useCaptcha(handleFinishCallback)

  async function handleClick() {
    if (await onClick()) {
      showCaptcha()
    }
  }

  return (
    <Button.Link
      type="primary"
      className="mobile-verification-code"
      loading={loading}
      disabled={count > 1}
      onClick={handleClick}
      {...restProps}
    >
      {count > 1 ? t('login.CountDown', { count }) : t('login.GetCode')}
    </Button.Link>
  )
}
