import { helper } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Form, Select } from '@/components'
import { IntegrationService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

import IntegrationAuthorization from './Authorization'
import { MapFields } from './MapFields'
import IntegrationSettingsForm, { IntegrationSettingsFormProps } from './SettingsForm'

export default function MondaySettings({ app }: IntegrationSettingsFormProps) {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { formFields } = useFormStore()

  const [isAuthorized, setAuthorized] = useState(app.isAuthorized)
  const [board, setBoard] = useState<number | string | undefined>()

  const { data: rightFields, loading } = useRequest(
    async () => {
      if (helper.isEmpty(board)) {
        return
      }

      const result = await IntegrationService.mondayFields(formId, app?.id as string, board!)

      return result.filter((row: any) => row.type === 'text')
    },
    {
      refreshDeps: [formId, app?.id, board]
    }
  )

  async function handleOAuth(code: string) {
    const result = await IntegrationService.mondayOauth(formId, app?.id as string, code)

    setAuthorized(result)
  }

  async function fetchBoards() {
    return IntegrationService.mondayBoards(formId, app?.id as string)
  }

  async function fetchGroups() {
    return IntegrationService.mondayGroups(formId, app?.id as string, board!)
  }

  function handleValuesChange(changed: AnyMap) {
    if (changed.board) {
      setBoard(changed.board.id)
    }
  }

  useEffect(() => {
    const attributes = app?.integration?.attributes as AnyMap

    if (helper.isValid(attributes)) {
      if (attributes.board) {
        setBoard(attributes.board.id)
      }
    }
  }, [])

  if (!isAuthorized && !app.isAuthorized) {
    return <IntegrationAuthorization app={app} fetch={handleOAuth} />
  }

  return (
    <IntegrationSettingsForm app={app} onValuesChange={handleValuesChange}>
      {/* Select board */}
      <Form.Item
        name="board"
        label={t('form.integrations.monday.board.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[isAuthorized]}
          type="number"
          returnOptionAsValue
          fetch={fetchBoards}
          labelKey="name"
          valueKey="id"
          disabled={!isAuthorized}
        />
      </Form.Item>

      {/* Group */}
      <Form.Item
        name="group"
        label={t('form.integrations.monday.group.headline')}
        rules={[{ required: true }]}
      >
        <Select.Async
          className="h-11 w-full sm:h-10"
          refreshDeps={[board]}
          returnOptionAsValue
          fetch={fetchGroups}
          labelKey="title"
          valueKey="id"
          disabled={helper.isNil(board)}
        />
      </Form.Item>

      {/* Full name */}
      <Form.Item
        name="itemName"
        label={t('form.integrations.monday.itemName.headline')}
        rules={[{ required: true }]}
      >
        <Select
          className="w-full"
          contentProps={{
            position: 'popper'
          }}
          options={formFields}
          placeholder={t('form.integrations.mapFields.leftPlaceholder')}
          labelKey="title"
          valueKey="id"
        />
      </Form.Item>

      {/* Map questions */}
      <MapFields
        name="fields"
        required={false}
        label={t('form.integrations.monday.columnValues.headline')}
        description={t('form.integrations.mapFields.subHeadline', { name: app?.name })}
        leftOptions={formFields}
        leftLabelKey="title"
        leftValueKey="id"
        leftPlaceholder={t('form.integrations.mapFields.leftPlaceholder')}
        rightLoading={loading}
        rightOptions={rightFields}
        rightLabelKey="title"
        rightValueKey="id"
        rightPlaceholder={t('form.integrations.mapFields.rightPlaceholder', { name: app?.name })}
      />
    </IntegrationSettingsForm>
  )
}
