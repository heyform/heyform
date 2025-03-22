import { getTheme, getThemeStyle } from '@heyform-inc/form-renderer'
import { FormTheme } from '@heyform-inc/shared-types-enums'

export function insertThemeStyle(customTheme?: FormTheme) {
  const theme = getTheme(customTheme)
  let content = getThemeStyle(theme)

  let style = document.getElementById('heyform-theme')

  if (!style) {
    style = document.createElement('style')
    style.id = 'heyform-theme'

    document.head.appendChild(style)
  }

  if (customTheme?.customCSS) {
    content += customTheme!.customCSS
  }

  style.innerHTML = content
}
