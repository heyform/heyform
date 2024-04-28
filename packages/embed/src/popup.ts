import IconClose from './assets/icon-close.svg'
import IconLoading from './assets/icon-loading.svg'
import IconMessage from './assets/icon-message.svg'
import { Modal } from './modal'
import { AnyMap, PopupSettings } from './type'
import { $, Dom, colorIsDark, logger } from './utils'

const POPUP_TEMPLATE = `
  <div id="{containerId}" class="heyform__popup heyform__popup-{position}">
    <button class="heyform__popup-button {buttonClass}" style="{buttonStyle}" onclick="HeyForm.togglePopup('{formId}')">
      {icon}
    </button>
  </div>
`

const IFRAME_TEMPLATE = `
  <div class="heyform__iframe-container" style="{style}">
    <iframe src="{src}" allow="microphone; camera"></iframe>
    <div class="heyform__loading-container">${IconLoading}</div>
  </div>
`

export class Popup<T extends PopupSettings> extends Modal<T> {
  override render() {
    const $el = $(`#${this.containerId}`)

    if ($el.exists()) {
      return
    }

    const data: AnyMap = {
      containerId: this.containerId,
      formId: this.formId,
      position: this.settings.position || 'bottom-right',
      icon: this.getIcon()
    }

    if (this.settings.triggerBackground) {
      data.buttonStyle = `background: ${this.settings.triggerBackground}`

      if (colorIsDark(this.settings.triggerBackground)) {
        data.buttonClass = 'heyform__popup-button-dark'
      }
    }

    Dom.template(POPUP_TEMPLATE, data)
    this.handleEvents()
  }

  public open() {
    const $el = $(`#${this.containerId}`)

    if (!$el.exists()) {
      return
    }

    const $frame = $el.find('.heyform__iframe-container')

    if ($frame.exists()) {
      return
    }

    const width = this.settings.width || 420
    const height = this.settings.height || 540

    $el.append(
      Dom.compile(IFRAME_TEMPLATE, {
        containerId: this.containerId,
        src: this.formUrl,
        style: `width:${width}px; height:${height}px`
      })
    )

    this.isOpen = true
    this.updateButtonIcon()

    setTimeout(() => {
      $el.find('iframe').get(0).onload = () => {
        $el.find('.heyform__loading-container').remove()
      }
    }, 0)

    logger.info('Popup opened')
  }

  public close() {
    $(`#${this.containerId} .heyform__iframe-container`).remove()

    this.isOpen = false
    this.updateButtonIcon()

    logger.info('Popup closed')
  }

  private updateButtonIcon() {
    const button = $(`#${this.containerId} .heyform__popup-button`)

    if (button) {
      button.html(this.getIcon())
    }
  }

  private getIcon() {
    let icon = IconMessage

    if (this.isOpen) {
      icon = IconClose
    } else {
      if (this.settings.iconUrl) {
        icon = `<img src="${this.settings.iconUrl}" alt="popup trigger" />`
      }
    }

    return icon
  }
}
