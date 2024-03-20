import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { Renderer, insertWebFont } from '@/components/formComponents'
import { type IFormModel } from '@/components/formComponents/typings'
import { Button, Modal, Spin, Switch, notification, useLockBodyScroll } from '@/components/ui'
import { STRIPE_PUBLISHABLE_KEY } from '@/consts'
import { useStore } from '@/store'
import { insertThemeStyle, loadScript } from '@/utils'

import './index.scss'

export const FormPreviewModal: FC = observer(() => {
  const appStore = useStore('appStore')
  const formStore = useStore('formStore')
  const [value, setValue] = useState('mobile')
  const [isLoaded, setIsLoaded] = useState(false)

  function handleClose() {
    appStore.isFormPreviewOpen = false
  }

  function handleChange(newValue: any) {
    setValue(newValue)
  }

  useLockBodyScroll(appStore.isFormPreviewOpen)

  useEffect(() => {
    if (appStore.isFormPreviewOpen && formStore.current) {
      insertWebFont(formStore.customTheme!.fontFamily)
      insertThemeStyle(formStore.customTheme!)

      const paymentField = formStore.current.fields?.find(f => f.kind == FieldKindEnum.PAYMENT)

      if (!paymentField) {
        return setIsLoaded(true)
      }

      loadScript('stripe', 'https://js.stripe.com/v3/', (err: any) => {
        if (err) {
          notification.error({
            title: err.message
          })
          setIsLoaded(false)
        } else {
          setIsLoaded(true)
        }
      })
    }
  }, [appStore.isFormPreviewOpen, formStore.current])

  return (
    <>
      {appStore.isFormPreviewOpen && formStore.current && (
        <Modal
          className="form-preview-modal"
          visible={true}
          maskClosable={false}
          showCloseIcon={false}
        >
          <div className="form-preview-header">
            <div className="flex flex-1 items-center justify-center">
              <Switch.Group
                className="!hidden text-sm md:!inline-flex"
                value={value}
                options={[
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'mobile', label: 'Mobile' }
                ]}
                onChange={handleChange}
              />
            </div>
            <Button.Link className="mr-4 p-2" onClick={handleClose}>
              <IconX />
            </Button.Link>
          </div>

          <div
            className={clsx('form-preview-body', {
              'form-preview-mobile': value === 'mobile'
            })}
          >
            {!isLoaded ? (
              <div className="flex h-full w-full items-center justify-center">
                <Spin />
              </div>
            ) : (
              <Renderer
                form={formStore.current as IFormModel}
                autoSave={false}
                stripeApiKey={STRIPE_PUBLISHABLE_KEY}
                stripeAccountId={formStore.current?.stripeAccount?.accountId}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  )
})
