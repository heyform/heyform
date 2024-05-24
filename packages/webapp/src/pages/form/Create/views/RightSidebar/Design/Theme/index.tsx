import { FormTheme } from '@heyform-inc/shared-types-enums'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Spin, notification } from '@/components/ui'
import { cropImage } from '@/components/ui/image'
import { FORM_THEMES } from '@/consts'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam } from '@/utils'

const ThemeItem: FC<{ theme: FormTheme }> = ({ theme }) => {
  const { formId } = useParam()
  const [loading, setLoading] = useState(false)
  const formStore = useStore('formStore')
	const { t } = useTranslation()

  async function handleClick() {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      await FormService.updateTheme(formId, {
        theme
      })

      formStore.updateCustomTheme(theme)

      notification.success({
        title: 'Theme settings updated'
      })
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    setLoading(false)
  }

  return (
    <div
      className="theme-item"
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundImage
          ? `url(${cropImage(theme.backgroundImage, 480, 240)})`
          : undefined
      }}
      onClick={handleClick}
    >
      <div
        className="theme-item-question"
        style={{
          color: theme.questionTextColor
        }}
      >
				{t('Question')}
      </div>
      <div
        className="theme-item-answer"
        style={{
          color: theme.answerTextColor
        }}
      >
        {t('Answer')}
      </div>
      <div
        className="theme-item-button"
        style={{
          background: theme.buttonBackground
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-slate-900 bg-opacity-50">
          <Spin className="text-white" />
        </div>
      )}
    </div>
  )
}

export const Theme: FC = () => (
  <div className="theme-list scrollbar space-y-6 p-4">
    {FORM_THEMES.map((theme, index) => (
      <ThemeItem key={index} theme={theme} />
    ))}
  </div>
)
