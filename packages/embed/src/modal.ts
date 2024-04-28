import IconClose from './assets/icon-close.svg'
import IconLoading from './assets/icon-loading.svg'
import { Standard } from './standard'
import { ModalSettings } from './type'
import { $, Dom, colorIsDark, isPlainObject, logger } from './utils'

const POPUP_TEMPLATE = `
  <div id="{containerId}" class="heyform__modal heyform__modal-{size}">
    <div class="heyform__iframe-container">
      <iframe src="{src}" allow="microphone; camera"></iframe>
      <div class="heyform__loading-container">${IconLoading}</div>
    </div>
    <button type="button" class="heyform__close-button" onclick="HeyForm.closeModal('{formId}')">
      ${IconClose}
    </button>
  </div>
`

export class Modal<T extends ModalSettings> extends Standard<T> {
  protected isOpen = false

  override render() {
    const $button = this.$container.find('.heyform__trigger-button')

    if ($button.exists() && this.settings.triggerBackground) {
      $button.style('background', this.settings.triggerBackground)

      if (colorIsDark(this.settings.triggerBackground)) {
        $button.addClass('heyform__trigger-button-dark')
      }
    }

    this.handleEvents()
  }

  public open() {
    const $el = $(`#${this.containerId}`)

    if ($el.exists()) {
      return
    }

    Dom.template(POPUP_TEMPLATE, {
      containerId: this.containerId,
      formId: this.formId,
      src: this.formUrl,
      size: this.settings.size || 'medium'
    })

    this.isOpen = true
    logger.info('Modal opened')

    setTimeout(() => {
      const $el = $(`#${this.containerId}`)

      $el.find('iframe').get(0).onload = () => {
        $el.find('.heyform__loading-container').remove()
      }
    }, 0)
  }

  public close() {
    $(`#${this.containerId}`).remove()
    this.isOpen = false

    logger.info('Modal closed')
  }

  public toggle() {
    this.isOpen ? this.close() : this.open()
  }

  protected handleEvents() {
    if (this.settings.openTrigger) {
      logger.info('Open event', this.settings.openTrigger)

      switch (this.settings.openTrigger) {
        case 'loaded':
          return this.onLoaded()

        case 'delay':
          return this.onDelay()

        case 'exit':
          return this.onExit()

        case 'scroll':
          return this.onScroll()
      }
    }

    if (this.settings.hideAfterSubmit) {
      window.onmessage = ({ data }: MessageEvent) => {
        if (!isPlainObject(data) || data.source !== 'HEYFORM') {
          return
        }

        logger.info('Message event', data)

        switch (data.eventName) {
          case 'HIDE_EMBED_MODAL':
          case 'HIDE_EMBED_POPUP':
            return setTimeout(() => {
              this.close()
            }, (this.settings.autoClose || 0) * 1_000)
        }
      }
    }
  }

  protected onLoaded() {
    window.onload = () => {
      this.open()
    }
  }

  protected onDelay() {
    setTimeout(() => {
      this.open()
    }, this.settings.openDelay)
  }

  protected onExit() {
    window.onmouseout = (e: any) => {
      if (!e.toElement || !e.relatedTarget) {
        this.open()
      }
    }
  }

  protected onScroll() {
    window.onscroll = () => {
      const scrollPercent =
        ((window.scrollY + window.innerHeight) / document.body.clientHeight) * 100

      if (scrollPercent >= this.settings.openScrollPercent! / 100) {
        this.open()
        window.onscroll = null
      }
    }
  }
}
