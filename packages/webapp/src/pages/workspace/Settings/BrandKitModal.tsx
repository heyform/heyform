import {
  DEFAULT_THEME,
  GOOGLE_FONTS,
  SYSTEM_FONTS,
  insertWebFont
} from '@heyform-inc/form-renderer'
import { IconChevronRight } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { insertThemeStyle } from '@/pages/form/Builder/utils'
import { WorkspaceService } from '@/services'
import { useParam } from '@/utils'
import { helper, pickObject } from '@heyform-inc/utils'

import { Button, ColorPicker, Form, ImageFormPicker, Modal, Select } from '@/components'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'

import { BackgroundImage } from '../../form/Builder/RightSidebar/Design/Customize'
import ImageBrightness from '../../form/Builder/RightSidebar/Question/ImageBrightness'

const ModalComponent = () => {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { workspace, updateWorkspace } = useWorkspaceStore()
  const { closeModal } = useAppStore()

  const brandKit: AnyMap = useMemo(() => {
    if (helper.isValidArray(workspace?.brandKits)) {
      const _brandKit = workspace.brandKits[0]

      return {
        id: _brandKit.id,
        logo: _brandKit.logo,
        ...(_brandKit.theme || DEFAULT_THEME)
      }
    }

    return DEFAULT_THEME
  }, [workspace?.brandKits])
  const [values, setValues] = useState(brandKit)

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

  function handleValuesChange(_changes: AnyMap, values: AnyMap) {
    setValues(values)
  }

  const { run, loading } = useRequest(
    async (newValues: AnyMap) => {
      const updates = {
        logo: newValues.logo,
        theme: pickObject(newValues, [], ['logo'])
      }

      let brandKitId = brandKit?.id

      if (!brandKitId) {
        brandKitId = await WorkspaceService.createBrandKit({
          teamId: workspaceId,
          ...updates
        })
      } else {
        await WorkspaceService.updateBrandKit({
          teamId: workspaceId,
          ...updates
        })
      }

      updateWorkspace(workspaceId, {
        brandKits: [
          {
            id: brandKitId,
            ...updates
          }
        ]
      })
    },
    {
      refreshDeps: [workspaceId, brandKit?.id],
      manual: true
    }
  )

  useEffect(() => {
    insertWebFont(values?.fontFamily)
    insertThemeStyle(values)
  }, [values])

  return (
    <div className="flex h-full">
      <div className="scrollbar border-accent-light bg-foreground h-full w-full border-r px-4 py-6 sm:w-80">
        <Form initialValues={brandKit} onValuesChange={handleValuesChange} onFinish={run}>
          <div className="flex items-center justify-between">
            <h2 className="text-base/6 font-semibold">{t('settings.branding.brandKitHeadline')}</h2>

            <Button.Link
              className="text-secondary hover:text-primary hidden !p-0 hover:bg-transparent sm:flex"
              size="sm"
              onClick={() => closeModal('BrandKitModal')}
            >
              {t('components.close')}
            </Button.Link>
          </div>

          <div className="mt-4 space-y-8">
            <div>
              <h3 className="text-sm/6 font-semibold">{t('settings.branding.logo.title')}</h3>
              <Form.Item
                className="mt-2"
                name="logo"
                rules={[
                  {
                    type: 'url',
                    message: t('settings.branding.logo.invalid')
                  }
                ]}
              >
                <ImageFormPicker
                  className="[&_[data-slot=avatar]]:h-8 [&_[data-slot=avatar]]:w-auto [&_[data-slot=avatar]]:after:hidden [&_[data-slot=avatar]_img]:aspect-auto [&_[data-slot=avatar]_img]:w-auto [&_[data-slot=avatar]_img]:rounded-none"
                  resize={{
                    height: 100
                  }}
                />
              </Form.Item>
            </div>

            <div>
              <h3 className="text-sm/6 font-semibold">{t('settings.branding.theme')}</h3>

              <div className="mt-2 space-y-4">
                <Form.Item name="fontFamily">
                  <Select
                    className="w-full sm:h-9"
                    options={options}
                    contentProps={{
                      position: 'popper'
                    }}
                  />
                </Form.Item>

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

              <div className="border-accent-light mt-2 border-t pt-2">
                <Form.Item
                  name="backgroundImage"
                  className="[&_[data-slot=content]]:flex-none [&_[data-slot=control]]:flex [&_[data-slot=control]]:items-center [&_[data-slot=control]]:justify-between"
                  label={t('form.builder.design.customize.backgroundImage')}
                >
                  <BackgroundImage />
                </Form.Item>
              </div>

              {helper.isValid(values?.backgroundImage) && (
                <div className="border-accent-light mt-2 border-t pt-2">
                  <Form.Item name="backgroundBrightness">
                    <ImageBrightness imageURL={values?.backgroundImage} />
                  </Form.Item>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-x-4">
            <Button type="submit" size="md" className="flex-1" loading={loading}>
              {t('components.saveChanges')}
            </Button>
          </div>
        </Form>
      </div>

      <div className="h-full flex-1">
        <div className="compose">
          <div className="heyform-root">
            <div className="heyform-wrapper">
              <div className="heyform-header">
                <div className="heyform-header-wrapper">
                  <div className="heyform-header-left">
                    {values?.logo && (
                      <div className="heyform-logo">
                        <img src={values.logo} alt="" />
                      </div>
                    )}
                  </div>
                  <div className="heyform-header-right"></div>
                </div>
              </div>
              <div className="compose-container heyform-body">
                <div className="heyform-theme-background"></div>
                <div className="heyform-block-container heyform-block-cover">
                  <div className="flex min-h-full flex-col items-center justify-center">
                    <div className="heyform-block heyform-short-text">
                      <div className="mb-10">
                        <div className="rich-text heyform-block-title">
                          {t('settings.branding.brandKitPreview.title')}
                        </div>
                        <div className="rich-text heyform-block-description">
                          {t('settings.branding.brandKitPreview.description')}
                        </div>
                      </div>
                      <input
                        className="heyform-input"
                        placeholder={t('settings.branding.brandKitPreview.input')}
                        disabled
                        type="text"
                      />
                      <div className="heyform-submit-container">
                        <div className="heyform-submit-container">
                          <div className="heyform-submit-button">
                            <span>{t('settings.branding.brandKitPreview.next')}</span>
                            <IconChevronRight />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BrandKitModal() {
  const { isOpen, onOpenChange } = useModal('BrandKitModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className:
          'p-0 w-full max-w-full max-h-[90vh] overflow-hidden h-[90vh] bg-foreground focus:outline-none focus-visible:outline-none sm:w-[90vw] sm:bg-background'
      }}
      isCloseButtonShow={false}
      onOpenChange={onOpenChange}
    >
      <ModalComponent />
    </Modal>
  )
}
