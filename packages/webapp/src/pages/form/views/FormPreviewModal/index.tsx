import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Modal, Select, Spin, notification, useLockBodyScroll } from '@/components'
import { STRIPE_PUBLISHABLE_KEY } from '@/consts'
import { Renderer, loadScript } from '@/pages/form/views/FormComponents'
// import { type IFormModel } from '@/pages/form/views/FormComponents/typings'
import { useAppStore, useFormStore } from '@/store'
import { insertThemeStyle } from '@/utils'

import { insertWebFont } from '../FormComponents/theme'
import './index.scss'

export const FormPreviewModal: FC = observer(() => {
  const appStore = useAppStore()
  const formStore = useFormStore()
  const [value, setValue] = useState('mobile')
  const [isLoaded, setIsLoaded] = useState(false)
  const { t } = useTranslation()

  function handleClose() {
    appStore.closeModal('FormPreviewModal')
  }

  function handleChange(newValue: any) {
    setValue(newValue)
  }

  useLockBodyScroll(appStore.modals.get('FormPreviewModal'))

  useEffect(() => {
    if (appStore.modals.get('FormPreviewModal') && formStore.form) {
      insertWebFont(formStore.form.themeSettings!.theme!.fontFamily)
      insertThemeStyle(formStore.form.themeSettings!.theme!)

      const paymentField = formStore.formFields?.find(f => f.kind == FieldKindEnum.PAYMENT)

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
  }, [appStore, formStore])

  return (
    <>
      {appStore.modals.get('FormPreviewModal') && formStore.form && (
        <Modal
          visible={true}
          contentProps={{
            className: 'form-preview-modal'
          }}
        >
          <div className="form-preview-header">
            <div className="ml-4 text-lg font-medium text-slate-900">{t('form.preview')}</div>
            <div className="flex flex-1 items-center justify-center">
              <Select
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
                form={formStore.form as any}
                autoSave={false}
                stripeApiKey={STRIPE_PUBLISHABLE_KEY}
                stripeAccountId={formStore.form?.stripeAccount?.accountId}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  )
})
