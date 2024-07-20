import { getConfigs } from './config'
import { FullPage } from './full-page'
import { Modal } from './modal'
import { Popup } from './popup'
import { Standard } from './standard'
import './style.scss'
import { logger } from './utils'

const loaded = new Set<string>()
const instances = new Map<string, Modal<any> | Popup<any>>()

function main() {
  try {
    const configs = getConfigs()

    configs.forEach(c => {
      const key = `${c.formId}-${c.type}`

      if (!loaded.has(key)) {
        loaded.add(key)

        switch (c.type) {
          case 'modal':
            return instances.set(key, new Modal(c))
    
          case 'popup':
            return instances.set(key, new Popup(c))
    
          case 'fullpage':
            return new FullPage(c)
    
          default:
            return new Standard(c)
        }
      }
    })
  
    logger.info('Configs', JSON.stringify(configs))
  } catch (err) {
    logger.error(err)
  }
}

function open(formId: string, type: 'modal' | 'popup') {
  const instance = instances.get(`${formId}-${type}`)

  if (instance) {
    instance.open()
  }
}

function close(formId: string, type: 'modal' | 'popup') {
  const instance = instances.get(`${formId}-${type}`)

  if (instance) {
    instance.close()
  }
}

function toggle(formId: string, type: 'modal' | 'popup') {
  const instance = instances.get(`${formId}-${type}`)

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

// Import the library after the element
main()

// Import the library before the element
window.addEventListener('DOMContentLoaded', main)
