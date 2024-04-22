import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, notification } from '@/components/ui'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

import { Basic } from './Basic'
import { FormStatus } from './FormStatus'
import { Protection } from './Protection'
import { Sidebar } from './Sidebar'
import './style.scss'

const FormSettings: FC = () => {
  const { t } = useTranslation()
  const { formId } = useParam()
  const formStore = useStore('formStore')

  function handleValuesChange(changes: IMapType) {
    formStore.updateTempSettings(changes)
  }

  function getUpdates(values: IMapType) {
    if (values.startDate) {
      values.enabledAt = values.startDate.tz(values.expirationTimeZone, true).unix()
      delete values.startDate
    }

    if (values.endDate) {
      values.closedAt = values.endDate.tz(values.expirationTimeZone, true).unix()
      delete values.endDate
    }

    values.active = !values.closeForm
    delete values.closeForm

    return values
  }

  async function handleFinish(values: IMapType) {
    const updates = getUpdates(values)

    await FormService.update(formId, updates)
    formStore.updateSettings(updates)

    notification.success({
      title: t('formSettings.formUpdated')
    })
  }

  return (
    <div className="form-content-container">
      <div className="container mx-auto max-w-5xl">
        <div className="flex">
          <Sidebar />

          <div className="mx-4 flex-1 md:ml-16 md:mr-0">
            <div className="mb-10 mt-14 space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900">{t('formSettings.Form')}</h1>
              <p className="text-sm text-slate-500">{t('formSettings.subTitle')}</p>
            </div>

            <Form.Custom
              initialValues={formStore.tempSettings}
              submitText={t('workspace.settings.up')}
              submitOptions={{
                type: 'primary',
                className: '!sticky bottom-6 mt-6 md:w-[120px] z-10'
              }}
              onlySubmitOnValueChange={true}
              onValuesChange={handleValuesChange}
              request={handleFinish}
            >
              <div className="space-y-10">
                <FormStatus />
                <Basic />
                <Protection />
              </div>
            </Form.Custom>

            <div className="sticky bottom-0 z-[9] -mx-4 h-[85px] bg-gradient-to-t from-slate-50 to-slate-50/95"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(FormSettings)
