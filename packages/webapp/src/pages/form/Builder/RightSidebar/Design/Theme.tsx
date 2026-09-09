import { getTheme } from '@heyform-inc/form-renderer'
import { FormTheme } from '@heyform-inc/shared-types-enums'
import { useBoolean } from 'ahooks'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { FormService } from '@/services'
import { useParam } from '@/utils'
import { helper } from '@heyform-inc/utils'

import { Image, Loader, useToast } from '@/components'
import { FORM_THEMES } from '@/consts'
import { useFormStore, useWorkspaceStore } from '@/store'

const ThemeItem: FC<{ theme: FormTheme; logo?: string }> = ({ theme, logo }) => {
  const { t } = useTranslation()

  const { formId } = useParam()
  const toast = useToast()
  const { updateThemeSettings, updateForm, themeSettings } = useFormStore()

  const [loading, { setTrue, setFalse }] = useBoolean(false)

  async function handleClick() {
    if (loading) {
      return
    }

    setTrue()

    try {
      const newTheme = getTheme(theme)

      await FormService.updateTheme({
        formId,
        theme: newTheme,
        favicon: themeSettings?.favicon,
        logo
      })

      updateForm({ themeSettings: { ...themeSettings, logo, theme: newTheme } })
      updateThemeSettings({
        logo,
        theme: newTheme
      })

      toast({
        title: t('form.builder.design.theme.success')
      })
    } catch (err: any) {
      toast({
        title: t('form.builder.design.theme.failed'),
        message: err.message
      })
    }

    setFalse()
  }

  return (
    <Image.Background
      as="li"
      className="after:border-accent relative cursor-pointer rounded-lg bg-cover p-4 after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:border"
      src={theme.backgroundImage}
      style={{
        backgroundColor: theme.backgroundColor
      }}
      onClick={handleClick}
    >
      <div
        className="text-sm font-medium"
        style={{
          color: theme.questionTextColor
        }}
      >
        {t('form.builder.question.title')}
      </div>
      <div
        className="-mt-1 mb-2 text-xs/6 font-medium"
        style={{
          color: theme.answerTextColor
        }}
      >
        {t('form.builder.question.answer')}
      </div>
      <div
        className="h-5 w-14 rounded-xl"
        style={{
          background: theme.buttonBackground
        }}
      />

      {logo && (
        <div className="absolute right-4 top-4">
          <img src={logo} alt="" className="block h-5 w-auto" />
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-slate-900 bg-opacity-50">
          <Loader className="text-foreground" />
        </div>
      )}
    </Image.Background>
  )
}

export default function Theme() {
  const { workspace } = useWorkspaceStore()
  const { t } = useTranslation()

  return (
    <div className="space-y-6 p-4">
      {helper.isValid(workspace?.brandKits) && (
        <div>
          <h3 className="text-sm/6 font-medium">{t('settings.branding.brandKitHeadline')}</h3>

          <ul className="mt-1.5 space-y-4">
            {workspace?.brandKits?.map((brandKit, index) => (
              <ThemeItem key={index} theme={brandKit.theme} logo={brandKit.logo} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm/6 font-medium">{t('settings.branding.presetThemes')}</h3>

        <ul className="mt-1.5 space-y-4">
          {FORM_THEMES.map((theme, index) => (
            <ThemeItem key={index} theme={theme} />
          ))}
        </ul>
      </div>
    </div>
  )
}
