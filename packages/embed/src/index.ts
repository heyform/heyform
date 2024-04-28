import { getConfigs } from './config'
import { FullPage } from './full-page'
import { Modal } from './modal'
import { Popup } from './popup'
import { Standard } from './standard'
import './style.scss'
import { logger } from './utils'

const cache = new Map<string, Modal<any> | Popup<any>>()

window.addEventListener('DOMContentLoaded', () => {
  const configs = getConfigs()

  configs.forEach(c => {
    switch (c.type) {
      case 'modal':
        return cache.set(`${c.formId}-${c.type}`, new Modal(c))

      case 'popup':
        return cache.set(`${c.formId}-${c.type}`, new Popup(c))

      case 'fullpage':
        return new FullPage(c)

      default:
        return new Standard(c)
    }
  })

  logger.info('Configs', JSON.stringify(configs))
})

function open(formId: string, type: 'modal' | 'popup') {
  const instance = cache.get(`${formId}-${type}`)

  if (instance) {
    instance.open()
  }
}

function close(formId: string, type: 'modal' | 'popup') {
  const instance = cache.get(`${formId}-${type}`)

  if (instance) {
    instance.close()
  }
}

function toggle(formId: string, type: 'modal' | 'popup') {
  const instance = cache.get(`${formId}-${type}`)

  if (instance) {
    instance.toggle()
  }
}

export const openModal = (formId: string) => open(formId, 'modal')
export const closeModal = (formId: string) => close(formId, 'modal')
export const toggleModal = (formId: string) => toggle(formId, 'modal')
export const openPopup = (formId: string) => open(formId, 'popup')
export const closePopup = (formId: string) => close(formId, 'popup')
export const togglePopup = (formId: string) => toggle(formId, 'popup')
