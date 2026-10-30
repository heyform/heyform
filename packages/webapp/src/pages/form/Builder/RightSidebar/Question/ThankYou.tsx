import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { startTransition, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Input, Switch } from '@/components'

import { useStoreContext } from '../../store'
import { RequiredSettingsProps } from './Required'

export default function ThankYou({ field }: RequiredSettingsProps) {
  const { t } = useTranslation()
  const { state, dispatch } = useStoreContext()
  const isFirstEnding = state.fields.find(f => f.kind === FieldKindEnum.THANK_YOU)?.id === field.id

  const handleChange = useCallback(
    (key: string, value: any) => {
      startTransition(() => {
        dispatch({
          type: 'updateField',
          payload: {
            id: field.id,
            updates: {
              properties: {
                ...field.properties,
                [key]: value
              }
            }
          }
        })
      })
    },
    [dispatch, field]
  )

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm/6" htmlFor="#">
            {t('form.builder.settings.discardSubmission')}
          </label>

          <Switch
            value={field.properties?.discardSubmission}
            onChange={value => handleChange('discardSubmission', value)}
          />
        </div>

        <p className="text-secondary text-xs">
          {t('form.builder.settings.discardSubmissionDescription')}
        </p>

        {field.properties?.discardSubmission && isFirstEnding && (
          <p className="text-error text-xs">
            {t('form.builder.settings.discardSubmissionFirstEnding')}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm/6" htmlFor="#">
            {t('form.builder.settings.redirect')}
          </label>

          <Switch
            value={field.properties?.redirectOnCompletion}
            onChange={value => handleChange('redirectOnCompletion', value)}
          />
        </div>

        {field.properties?.redirectOnCompletion && (
          <>
            <Input
              placeholder="https://example.com"
              type="url"
              value={field.properties?.redirectUrl}
              onChange={value => handleChange('redirectUrl', value)}
            />

            <Input
              className="mt-2"
              trailing={t('form.share.embed.secondsDelay')}
              type="number"
              defaultValue={0}
              min={0}
              value={field.properties?.redirectDelay || 0}
              onChange={value => handleChange('redirectDelay', value)}
            />
          </>
        )}
      </div>
    </div>
  )
}
