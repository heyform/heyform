import { locales } from '@heyform-inc/form-renderer/src'
import { FormModel } from '@heyform-inc/shared-types-enums'
import { useEffect, useState } from 'react'

import { getFormLanguage } from './utils/brower-language'
import { setFormMetadata } from './utils/metadata'
import { FormService } from '@/services'
import { useParam, useQuery } from '@/utils'

import { Async } from '@/components'
import '@/styles/render.scss'
import { FormThemeSettings } from '@/types'

import { Renderer } from './components/Renderer'

const LANGUAGES = Object.keys(locales)

export default function FormRender() {
  const { formId } = useParam()
  const query = useQuery()

  const [form, setForm] = useState<FormModel | null>(null)
  const [locale, setLocale] = useState<string>()

  useEffect(() => {
    if (form) {
      return setFormMetadata(form.name, (form.themeSettings as FormThemeSettings)?.favicon)
    }
  }, [form])

  async function fetchData() {
    const result = await FormService.publicForm(formId)

    setForm(result)
    setLocale(getFormLanguage(LANGUAGES, result.settings?.locale))

    return true
  }

  return (
    <Async fetch={fetchData}>
      {form && (
        <div id="heyform-render-root">
          <Renderer form={form} query={query} locale={locale!} />
        </div>
      )}
    </Async>
  )
}
