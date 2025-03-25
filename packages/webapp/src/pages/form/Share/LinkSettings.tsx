import { flattenFields } from '@heyform-inc/answer-utils'
import { UNSELECTABLE_FIELD_KINDS } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { useMemo, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import OgIcon from '@/assets/og.svg?react'
import { Button, Image, ImagePicker, ImagePickerRef, Input, Tooltip } from '@/components'
import { FormService } from '@/services'
import { useFormStore } from '@/store'
import { useParam } from '@/utils'

export default function LinkSettings() {
  const { t } = useTranslation()

  const { formId } = useParam()
  const { form, updateSettings } = useFormStore()
  const imagePickerRef = useRef<ImagePickerRef | null>(null)

  const { title, description } = useMemo(() => {
    if (form) {
      const fieldsCount = flattenFields(form.drafts).filter(
        f => !UNSELECTABLE_FIELD_KINDS.includes(f.kind)
      ).length
      let description = fieldsCount <= 1 ? `1 question` : `${fieldsCount} questions`

      const timeToComplete = Math.round(1.2 * (Math.log(fieldsCount) / Math.log(2)))
      const unit = !isNaN(timeToComplete) && timeToComplete > 1 ? 'mins' : 'min'

      description += `, ${timeToComplete} ${unit} to complete`

      return {
        title: form.name,
        description
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
      <p className="text-sm/6 text-secondary">{t('form.share.settings.subHeadline')}</p>

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
              // onFocus={}
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
              value={form?.settings?.metaDescription}
              // onFocus={}
              onChange={value => run('metaDescription', value)}
            />
          </div>
        </div>

        <div className="w-full sm:w-96">
          <div className="text-base/6 font-medium sm:text-sm/6">
            {t('form.share.settings.preview.headline')}
          </div>
          <div className="text-sm text-secondary">
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
                    className="!h-auto !p-0 !text-sm text-primary underline"
                    onClick={handleUpload}
                  />
                )
              }}
            />

            <div className="mt-4 select-none rounded-lg border border-input">
              {helper.isValid(form?.settings?.metaOGImageUrl) ? (
                <div className="group relative h-full w-full">
                  <Image
                    src={form!.settings!.metaOGImageUrl}
                    className="aspect-[1200/630] w-full rounded-lg"
                  />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                    <div className="flex items-center gap-1 rounded-lg bg-foreground px-1.5 py-1">
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
                    <div className="mx-[28px] mt-[25px]">
                      <div className="inline-block h-[28px] rounded-[6px] border border-[rgba(15,23,42,0.3)] px-[25px] text-sm font-medium leading-[28px]">
                        {description}
                      </div>
                    </div>
                    <div className="mx-[28px] flex h-[100px] items-center">
                      <div
                        className="text-[22px] font-bold leading-[26px]"
                        style={{
                          lineClamp: 2
                        }}
                      >
                        {title}
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
