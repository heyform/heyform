import { FormModel } from '@heyform-inc/shared-types-enums'
import { useState } from 'react'

import { getPreferredLanguage } from './utils/brower-language'
import { FormService } from '@/services'
import { useParam, useQuery } from '@/utils'

import { Async } from '@/components'
import '@/styles/render.scss'

import { Renderer } from './components/Renderer'

const LANGUAGES = ['en', 'de', 'fr', 'pl', 'pt-br', 'ja', 'zh-cn', 'zh-tw']

export default function FormRender() {
  const { formId } = useParam()
  const query = useQuery()

  const [form, setForm] = useState<FormModel | null>(null)
  const [locale, setLocale] = useState<string>()

  async function fetchData() {
    const result = await FormService.publicForm(formId)

    setForm(result)
    setLocale(getPreferredLanguage(LANGUAGES, result.form.settings.locale || LANGUAGES[0]))

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
