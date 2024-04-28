import { AnyMap, EmbedConfig } from './type'
import { $ } from './utils'

const ATTR_PREFIX = 'data-heyform-'
const HIDDEN_FIELD_PREFIX = `${ATTR_PREFIX}hiddenfield-`
const ID_ATTR_NAME = `${ATTR_PREFIX}id`
const TYPE_ATTR_NAME = `${ATTR_PREFIX}type`

export function getConfigs() {
  const $form = $(`[${ID_ATTR_NAME}]`)

  return $form.map(el => {
    const settings: AnyMap = {}
    const hiddenFields: AnyMap = {}

    const names = el.getAttributeNames()

    names.forEach(name => {
      let key = name.toLowerCase()

      if (key.startsWith(HIDDEN_FIELD_PREFIX)) {
        key = key.replace(HIDDEN_FIELD_PREFIX, '')

        hiddenFields[key] = el.getAttribute(name)
      } else if (key.startsWith(ATTR_PREFIX)) {
        key = key.replace(ATTR_PREFIX, '').replace(/(\-)+([a-z])/gi, (_, __, s) => s.toUpperCase())

        settings[key] = el.getAttribute(name)
      }
    })

    const formId = el.getAttribute(ID_ATTR_NAME) as string
    const type = el.getAttribute(TYPE_ATTR_NAME) as string

    return {
      formId,
      type,
      container: $(el as HTMLElement),
      settings,
      hiddenFields
    } as EmbedConfig<any>
  })
}
