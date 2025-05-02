import { GOOGLE_FONTS, SYSTEM_FONTS, insertWebFont } from '@heyform-inc/form-renderer'
import { alpha, darken, helper, isDarkColor, lighten } from '@heyform-inc/utils'
import { useRequest } from 'ahooks'
import { useForm as useRCForm } from 'rc-field-form'
import { FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, ColorPicker, Form, Modal, Select, Switch } from '@/components'
import { DEFAULT_CUSTOM_REPORT_THEME } from '@/consts'
import { FormService } from '@/services'
import { useAppStore, useFormStore, useModal, useWorkspaceStore } from '@/store'
import { nextTick, useParam } from '@/utils'

import { BackgroundImage } from '../Builder/RightSidebar/Design/Customize'
import ImageBrightness, {
  getBrightnessStyle
} from '../Builder/RightSidebar/Question/ImageBrightness'
import { ReportList } from './Report'

interface ReportBackgroundProps {
  backgroundImage?: string
  brightness?: number
}

const ReportBackground: FC<ReportBackgroundProps> = ({ backgroundImage, brightness = 0 }) => {
  const isImage = useMemo(() => helper.isURL(backgroundImage), [backgroundImage])

  return (
    <div className="pointer-events-none fixed bottom-0 left-80 right-0 top-0 z-0">
      {isImage ? (
        <img
          className="h-full w-full object-cover"
          src={backgroundImage}
          style={getBrightnessStyle(brightness)}
          alt="HeyForm report background"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            backgroundImage,
            ...getBrightnessStyle(brightness)
          }}
        />
      )}
    </div>
  )
}

const CustomReportComponent = () => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const [rcForm] = useRCForm()
  const { closeModal } = useAppStore()
  const { sharingURLPrefix } = useWorkspaceStore()
  const { form, updateCustomReport } = useFormStore()

  const shareLink = useMemo(
    () => sharingURLPrefix + '/form/' + formId + '/report',
    [formId, sharingURLPrefix]
  )

  const prevTheme = useMemo(() => {
    return helper.isValid(form?.customReport?.theme)
      ? form!.customReport.theme
      : DEFAULT_CUSTOM_REPORT_THEME
  }, [form])

  const [theme, setTheme] = useState<AnyMap>(prevTheme)

  const style = useMemo(
    () => ({
      fontFamily: theme.fontFamily,
      backgroundColor: theme.backgroundColor,
      '--heyform-report-heading': theme.heading,
      '--heyform-report-heading-a60': alpha(theme.heading, 0.6),
      '--heyform-report-question': theme.question,
      '--heyform-report-question-a60': alpha(theme.question, 0.6),
      '--heyform-report-question-a05': alpha(theme.question, 0.05),
      '--heyform-report-chart': theme.chart,
      '--heyform-report-chart-a15': alpha(theme.chart, 0.15),
      '--heyform-report-chart-a025': alpha(theme.chart, 0.025),
      '--heyform-report-button-text': isDarkColor(theme.question)
        ? lighten(theme.question, 1)
        : darken(theme.question, 1)
    }),
    [theme.backgroundColor, theme.chart, theme.fontFamily, theme.heading, theme.question]
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

  const { loading: publicAccessLoading, run: handlePublicAccessChange } = useRequest(
    async (enablePublicAccess: boolean) => {
      await FormService.updateCustomReport({
        formId,
        enablePublicAccess
      })

      updateCustomReport({
        enablePublicAccess
      })
    },
    {
      refreshDeps: [formId],
      manual: true
    }
  )

  const { loading: themeLoading, run: handleThemeChange } = useRequest(
    async (theme: AnyMap) => {
      await FormService.updateCustomReport({
        formId,
        theme
      })

      updateCustomReport({
        theme
      })
    },
    {
      refreshDeps: [formId],
      manual: true
    }
  )

  function handleRevert() {
    setTheme(prevTheme)

    nextTick(() => {
      rcForm.setFieldsValue(prevTheme)
      rcForm.resetFields()
    })
  }

  useEffect(() => {
    insertWebFont(GOOGLE_FONTS)
  }, [])

  return (
    <div className="flex h-full">
      <div className="scrollbar h-full w-full border-r border-accent-light px-4 py-6 sm:w-80">
        <div className="flex items-center justify-between">
          <h2 className="text-base/6 font-semibold">{t('form.customReport.title')}</h2>

          <Button.Link
            className="hidden !p-0 text-secondary hover:bg-transparent hover:text-primary sm:flex"
            size="sm"
            onClick={() => closeModal('CustomReportModal')}
          >
            {t('components.close')}
          </Button.Link>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="enablePublicAccess"
              className="select-none text-base/6 font-medium sm:text-sm/6"
            >
              {t('form.customReport.enablePublicAccess')}
            </label>
            <Switch
              id="enablePublicAccess"
              loading={publicAccessLoading}
              value={form?.customReport?.enablePublicAccess}
              onChange={handlePublicAccessChange}
            />
          </div>

          {form?.customReport?.enablePublicAccess && (
            <Button.Copy2
              className="w-full"
              text={shareLink}
              label={t('form.customReport.copyLink')}
            />
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-sm/6 font-semibold">{t('form.customReport.theme')}</h3>

          <Form
            className="mt-2 space-y-4"
            form={rcForm}
            initialValues={theme}
            onValuesChange={(_, values) => setTheme(values)}
            onFinish={handleThemeChange}
          >
            <Form.Item name="fontFamily">
              <Select
                className="w-full bg-foreground"
                options={options}
                contentProps={{
                  position: 'popper'
                }}
              />
            </Form.Item>

            <div className="space-y-4">
              <Form.Item
                name="heading"
                className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
                label={t('form.customReport.heading')}
              >
                <ColorPicker
                  contentProps={{
                    side: 'bottom',
                    align: 'end'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="question"
                className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
                label={t('form.customReport.question')}
              >
                <ColorPicker
                  contentProps={{
                    side: 'bottom',
                    align: 'end'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="chart"
                className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
                label={t('form.customReport.chart')}
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
                label={t('form.customReport.background')}
              >
                <ColorPicker
                  contentProps={{
                    side: 'bottom',
                    align: 'end'
                  }}
                />
              </Form.Item>
            </div>

            <div className="border-t border-accent-light pt-4">
              <Form.Item
                name="backgroundImage"
                className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
                label={t('form.builder.design.customize.backgroundImage')}
              >
                <BackgroundImage />
              </Form.Item>
            </div>

            {helper.isValid(theme?.backgroundImage) && (
              <div className="border-t border-accent-light pt-4">
                <Form.Item name="brightness">
                  <ImageBrightness imageURL={theme?.backgroundImage} />
                </Form.Item>
              </div>
            )}

            <div className="flex items-center gap-x-4 border-t border-accent-light pt-4">
              <Button.Ghost size="md" onClick={handleRevert}>
                {t('components.revert')}
              </Button.Ghost>
              <Button type="submit" size="md" className="flex-1" loading={themeLoading}>
                {t('components.saveChanges')}
              </Button>
            </div>
          </Form>
        </div>
      </div>

      <div className="h-full flex-1">
        <div className="scrollbar hidden h-full w-full bg-white lg:block">
          <div className="heyform-report relative" style={style}>
            {theme?.backgroundImage && (
              <ReportBackground
                backgroundImage={theme.backgroundImage}
                brightness={theme.brightness}
              />
            )}
            <div className="relative z-10 mx-auto max-w-4xl py-32">
              <ReportList isHideFieldEnabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomReportModal() {
  const { isOpen, onOpenChange } = useModal('CustomReportModal')

  return (
    <Modal
      open={isOpen}
      overlayProps={{
        className: 'bg-black/60 sm:bg-transparent'
      }}
      contentProps={{
        className:
          'p-0 w-screen max-w-screen max-h-[80vh] overflow-hidden h-screen bg-foreground focus:outline-none focus-visible:outline-none sm:bg-background sm:max-h-screen sm:!border-none sm:!rounded-none'
      }}
      isCloseButtonShow={false}
      onOpenChange={onOpenChange}
    >
      <CustomReportComponent />
    </Modal>
  )
}
