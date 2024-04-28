import IconLoading from './assets/icon-loading.svg'
import { EmbedConfig, StandardSettings } from './type'
import { Dom, buildUrl, isMobile } from './utils'

const STANDARD_TEMPLATE = `
<div class="heyform__iframe-container">
  <iframe src="{src}" allow="microphone; camera"></iframe>
  <div class="heyform__loading-container">${IconLoading}</div>
</div>
`

export class Standard<T extends StandardSettings> {
  protected readonly formId: string
  protected readonly containerId: string
  protected readonly $container: Dom
  protected readonly settings: EmbedConfig<T>['settings']
  protected readonly formUrl: string

  constructor(config: EmbedConfig<T>) {
    const { formId, type, container, settings, hiddenFields } = config

    this.formUrl = buildUrl(settings.customUrl.replace(/\/+$/, `/${formId}?`), {
      ...settings,
      ...hiddenFields
    })

    container.addClass('heyform__embed')
    container.addClass(`heyform__embed-${type}`)

    this.formId = formId
    this.containerId = `heyform__${type}-${formId}`
    this.$container = container
    this.settings = settings

    this.render()
  }

  protected render() {
    this.$container.style('width', `${this.settings.width}${this.settings.widthType}`)

    setTimeout(() => {
      let height = this.settings.height

      if (this.settings.heightType === 'auto') {
        const rect = this.$container.rect()

        height = isMobile ? window.innerHeight : Math.min(window.innerHeight, rect.width * 0.6)
      }

      this.$container.style('height', `${height}px`)
    }, 0)

    this.$container.append(
      Dom.compile(STANDARD_TEMPLATE, {
        src: this.formUrl
      })
    )

    this.$container.find('iframe').get(0).onload = () => {
      this.$container.find('.heyform__loading-container').remove()
    }
  }
}
