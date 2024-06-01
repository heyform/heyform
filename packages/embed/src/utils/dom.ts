import { AnyMap } from '../type'
import { isArray, isPlainObject } from './common'

export class Dom {
  private readonly elements: HTMLElement[] = []
  public length = 0

  constructor(selector: any, context: Document | HTMLElement | HTMLElement[] = document) {
    if (selector) {
      if (selector instanceof Dom) {
        return selector
      }

      if (selector.nodeType) {
        this.elements[0] = selector
      } else {
        const contexts = isArray(context) ? context : [context]

        this.elements = contexts.reduce(
          (prev: HTMLElement[], ctx) => [...prev, ...Array.from(ctx.querySelectorAll(selector))],
          [] as HTMLElement[]
        )
      }

      this.length = this.elements.length
    }
  }

  each(callback: (el: HTMLElement, index?: number) => void) {
    this.elements.forEach(callback)

    return this
  }

  map<T>(callback: (el: HTMLElement, index?: number) => T) {
    return this.elements.map(callback)
  }

  addClass(className: string) {
    this.elements.forEach(el => el.classList.add(className))

    return this
  }

  removeClass(className: string) {
    this.elements.forEach(el => el.classList.remove(className))

    return this
  }

  style(name: any, value?: any) {
    let styles: AnyMap = {
      [name]: value
    }

    if (isPlainObject(name)) {
      styles = name
    }

    this.elements.forEach(el => {
      Object.assign(el.style, styles)
    })

    return this
  }

  find(selector: string) {
    return new Dom(selector, this.elements)
  }

  get(index: number) {
    return this.elements[index]
  }

  on(event: string, callback: EventListener) {
    this.elements.forEach(el => el.addEventListener(event, callback))

    return this
  }

  off(event: string, callback: EventListener) {
    this.elements.forEach(el => el.removeEventListener(event, callback))

    return this
  }

  rect() {
    return this.elements[0].getBoundingClientRect()
  }

  html(html: string) {
    this.elements.forEach(el => (el.innerHTML = html))

    return this
  }

  remove() {
    this.elements.forEach(el => el.remove())

    return this
  }

  exists() {
    return this.length > 0
  }

  append(html: string) {
    this.elements.forEach(el => el.insertAdjacentHTML('beforeend', html))

    return this
  }

  static compile(template: string, data: AnyMap) {
    return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || '')
  }

  static template(template: string, data: AnyMap, parent = document.body) {
    parent.insertAdjacentHTML('beforeend', Dom.compile(template, data))
  }
}

export function $(selector: any, context: HTMLElement | Document = document) {
  return new Dom(selector, context)
}
