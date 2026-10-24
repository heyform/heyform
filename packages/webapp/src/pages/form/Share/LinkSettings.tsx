import { IconTrash, IconUpload } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { FormService } from '@/services'
import { useParam } from '@/utils'
import { helper } from '@heyform-inc/utils'

import OgIcon from '@/assets/og.svg?react'
import { Button, Image, ImagePicker, ImagePickerRef, Input, Tooltip } from '@/components'
import { useFormStore } from '@/store'

export default function LinkSettings() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { form, updateSettings } = useFormStore()
  const imagePickerRef = useRef<ImagePickerRef | null>(null)

  const { title, description } = useMemo(() => {
    if (form) {
      return {
        title: form.settings?.metaTitle ?? form.name,
        description: form.settings?.metaDescription ?? ''
      }
    }

    return {}
  }, [form])

  const { run } = useRequest(
    async (name: string, value?: string | null) => {
      const updates = {
        [name]: value
      }

      updateSettings(updates)
      await FormService.update(formId, updates)
    },
    {
      debounceWait: 300,
      manual: true,
      refreshDeps: [formId]
    }
  )

  function handleUpload() {
    imagePickerRef.current?.open()
  }

  return (
    <section id="settings">
      <div className="flex items-center gap-4">
        <h2 className="text-base/6 font-semibold">{t('form.share.settings.headline')}</h2>
      </div>
      <p className="text-secondary text-sm/6">{t('form.share.settings.subHeadline')}</p>

      <div className="mt-4 flex flex-col gap-4 sm:w-4/5 sm:flex-row sm:gap-10">
        <div className="w-full space-y-4 sm:w-96">
          <div className="space-y-1">
            <div>
              <label
                htmlFor="meta-title"
                className="select-none text-base/6 font-medium sm:text-sm/6"
              >
                {t('form.share.settings.title')}
              </label>
            </div>
            <Input
              id="meta-title"
              maxLength={70}
              value={title}
              onChange={value => run('metaTitle', value)}
            />
          </div>

          <div className="space-y-1">
            <div>
              <label
                htmlFor="meta-description"
                className="select-none text-base/6 font-medium sm:text-sm/6"
              >
                {t('form.share.settings.description')}
              </label>
            </div>
            <Input.TextArea
              id="meta-description"
              rows={6}
              maxLength={156}
              value={description}
              onChange={value => run('metaDescription', value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-96">
          <div className="text-base/6 font-medium sm:text-sm/6">
            {t('form.share.settings.preview.headline')}
          </div>
          <div className="text-secondary text-sm">
            <Trans
              key="meta-preview"
              t={t}
              i18nKey="form.share.settings.preview.subHeadline"
              components={{
                a: (
                  <a
                    href="https://www.freecodecamp.org/news/what-is-open-graph-and-how-can-i-use-it-for-my-website/"
                    target="_blank"
                    rel="noreferrer"
                  />
                ),
                button: (
                  <Button.Link
                    className="text-primary !h-auto !p-0 !text-sm underline"
                    onClick={handleUpload}
                  />
                )
              }}
            />

            <div className="border-input mt-4 select-none rounded-lg border">
              {helper.isValid(form?.settings?.metaOGImageUrl) ? (
                <div className="group relative h-full w-full">
                  <Image
                    src={form!.settings!.metaOGImageUrl}
                    className="aspect-[1200/630] w-full rounded-lg"
                  />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                    <div className="bg-foreground flex items-center gap-1 rounded-lg px-1.5 py-1">
                      <Tooltip label={t('components.change')}>
                        <Button.Link size="sm" iconOnly onClick={handleUpload}>
                          <IconUpload className="h-5 w-5" />
                        </Button.Link>
                      </Tooltip>
                      <Tooltip label={t('components.delete')}>
                        <Button.Link size="sm" iconOnly onClick={() => run('metaOGImageUrl', null)}>
                          <IconTrash className="h-5 w-5" />
                        </Button.Link>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[1200/630] select-none rounded-lg bg-white">
                  <OgIcon className="h-full w-full rounded-lg" />

                  <div className="absolute inset-0 text-black">
                    <div className="mx-[28px] flex h-[130px] flex-col justify-center gap-2">
                      <div
                        className="text-[22px] font-bold leading-[26px]"
                        style={{
                          lineClamp: 2
                        }}
                      >
                        {title}
                      </div>
                      <div
                        className="text-sm leading-5 opacity-85"
                        style={{
                          lineClamp: 2
                        }}
                      >
                        {description}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImagePicker
        ref={imagePickerRef}
        tabs={['image']}
        tabConfigs={{
          image: {
            title: t('form.share.settings.preview.uploadTitle'),
            description: t('form.share.settings.preview.uploadDescription')
          }
        }}
        onChange={value => run('metaOGImageUrl', value)}
      />
    </section>
  )
}
