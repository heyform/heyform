import { GOOGLE_FONTS, SYSTEM_FONTS, insertWebFont } from '@heyform-inc/form-renderer'
import { FormTheme } from '@heyform-inc/shared-types-enums'
import { useRequest } from 'ahooks'
import { useForm as useRCForm } from 'rc-field-form'
import { FC, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormService } from '@/services'
import { nextTick, useParam } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Button, ColorPicker, Form, ImagePicker, Input, Select, useToast } from '@/components'
import { useFormStore } from '@/store'

import ImageBrightness, { ImageBrightnessProps } from '../Question/ImageBrightness'

export const BackgroundImage: FC<Pick<ImageBrightnessProps, 'value' | 'onChange'>> = ({
  value,
  onChange
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <ImagePicker tabs={['image', 'gradient', 'unsplash']} onChange={onChange}>
        <Button.Ghost size="sm">
          {t(helper.isValid(value) ? 'components.change' : 'components.add')}
        </Button.Ghost>
      </ImagePicker>

      {helper.isValid(value) && (
        <Button.Ghost size="sm" onClick={() => onChange?.(undefined)}>
          {t('components.remove')}
        </Button.Ghost>
      )}
    </div>
  )
}

export default function Customize() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const toast = useToast()
  const [rcForm] = useRCForm()
  const { themeSettings, updateThemeSettings, revertThemeSettings, updateForm } = useFormStore()

  const { loading, run } = useRequest(
    async (theme: any) => {
      await FormService.updateTheme({
        formId,
        theme,
        logo: themeSettings?.logo,
        favicon: themeSettings?.favicon
      })
      updateForm({ themeSettings: { ...themeSettings, theme } })
    },
    {
      refreshDeps: [formId, themeSettings?.logo, themeSettings?.favicon],
      manual: true,
      onSuccess: () => {
        toast({
          title: t('form.builder.design.theme.success')
        })
      },
      onError: (err: any) => {
        console.error(err)

        toast({
          title: t('form.builder.design.theme.failed'),
          message: err.message
        })
      }
    }
  )

  const options = useMemo(
    () => [
      {
        value: SYSTEM_FONTS,
        label: (
          <span
            style={{
              fontFamily: SYSTEM_FONTS
            }}
          >
            {t('form.builder.design.customize.systemFonts')}
          </span>
        )
      },
      ...GOOGLE_FONTS.map(value => ({
        value,
        label: (
          <span
            style={{
              fontFamily: value
            }}
          >
            {value}
          </span>
        )
      }))
    ],
    [t]
  )

  function handleRevert() {
    revertThemeSettings()

    nextTick(() => {
      rcForm.setFieldsValue(themeSettings?.theme)
      rcForm.resetFields()
    })
  }

  function handleValuesChange(_: AnyMap, theme: FormTheme) {
    if (helper.isEmpty(theme.backgroundImage)) {
      theme.backgroundBrightness = 0

      nextTick(() => {
        rcForm.setFieldValue('backgroundBrightness', 0)
      })
    }

    updateThemeSettings({
      theme
    })
  }

  useEffect(() => {
    insertWebFont(GOOGLE_FONTS)
  }, [])

  return (
    <>
      <Form
        form={rcForm}
        initialValues={themeSettings?.theme}
        className="space-y-4 p-4"
        onValuesChange={handleValuesChange}
        onFinish={run}
      >
        <div className="flex items-center justify-between">
          <span>
            {String(t('form.builder.design.customize.favicon', { defaultValue: 'Favicon' }))}
          </span>
          <div className="flex items-center gap-2">
            {themeSettings?.favicon && (
              <img src={themeSettings.favicon} alt="" className="h-6 w-6 object-contain" />
            )}
            <ImagePicker tabs={['image']} onChange={favicon => updateThemeSettings({ favicon })}>
              <Button.Ghost size="sm">
                {String(t(themeSettings?.favicon ? 'components.change' : 'components.add'))}
              </Button.Ghost>
            </ImagePicker>
            {themeSettings?.favicon && (
              <Button.Ghost size="sm" onClick={() => updateThemeSettings({ favicon: null })}>
                {String(t('components.remove'))}
              </Button.Ghost>
            )}
          </div>
        </div>
        <Form.Item name="fontFamily">
          <Select
            className="w-full"
            options={options}
            contentProps={{
              position: 'popper'
            }}
          />
        </Form.Item>

        <div className="space-y-4">
          <Form.Item
            name="questionTextColor"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.question')}
          >
            <ColorPicker
              contentProps={{
                side: 'bottom',
                align: 'end'
              }}
            />
          </Form.Item>

          <Form.Item
            name="answerTextColor"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.answer')}
          >
            <ColorPicker
              contentProps={{
                side: 'bottom',
                align: 'end'
              }}
            />
          </Form.Item>

          <Form.Item
            name="buttonBackground"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.buttons')}
          >
            <ColorPicker
              contentProps={{
                side: 'bottom',
                align: 'end'
              }}
            />
          </Form.Item>

          <Form.Item
            name="buttonTextColor"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.buttonText')}
          >
            <ColorPicker
              contentProps={{
                side: 'bottom',
                align: 'end'
              }}
            />
          </Form.Item>

          <Form.Item
            name="backgroundColor"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.background')}
          >
            <ColorPicker
              contentProps={{
                side: 'bottom',
                align: 'end'
              }}
            />
          </Form.Item>
        </div>

        <div className="border-accent-light border-t pt-4">
          <Form.Item
            name="backgroundImage"
            className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
            label={t('form.builder.design.customize.backgroundImage')}
          >
            <BackgroundImage />
          </Form.Item>
        </div>

        {helper.isValid(themeSettings?.theme?.backgroundImage) && (
          <div className="border-accent-light border-t pt-4">
            <Form.Item name="backgroundBrightness">
              <ImageBrightness imageURL={themeSettings?.theme?.backgroundImage} />
            </Form.Item>
          </div>
        )}

        <div className="border-accent-light border-t pt-4">
          <Form.Item
            name="customCSS"
            label={
              <div className="flex items-center justify-between">
                <span>{t('form.builder.design.customize.customCSS')}</span>
              </div>
            }
          >
            <Input.TextArea className="mt-2" rows={4} />
          </Form.Item>
        </div>

        <div className="border-accent-light bg-foreground sticky bottom-4 flex items-center gap-x-4 border-t pt-4">
          <Button.Ghost size="md" onClick={handleRevert}>
            {t('components.revert')}
          </Button.Ghost>
          <Button type="submit" size="md" className="flex-1" loading={loading}>
            {t('components.saveChanges')}
          </Button>
        </div>
      </Form>
    </>
  )
}
