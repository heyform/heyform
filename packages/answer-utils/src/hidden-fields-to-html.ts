import { HiddenFieldAnswer } from '@heyform-inc/shared-types-enums'

export function hiddenFieldsToHtml(hiddenFields: HiddenFieldAnswer[]): string {
  if (!hiddenFields.length) return ''

  const html = hiddenFields
    .map(hiddenField => {
      return `
<li>
  <h3>${hiddenField.name}</h3>
  <p>${hiddenField.value}</p>
</li>
`
    })
    .join('')

  return `<ol>${html}</ol>`
}
