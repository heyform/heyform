import { AnyMap } from '../typings'

interface TimeoutProps {
  name: string
  duration: number
  callback: () => void
}

export class Timeout {
  private readonly caches: AnyMap<number> = {}

  add({ name, duration, callback }: TimeoutProps) {
    this.caches[name] = setTimeout(callback, duration)
  }

  remove(name: string) {
    const cache = this.caches[name]

    if (cache) {
      clearTimeout(cache)
      delete this.caches[name]
    }
  }

  clear() {
    Object.keys(this.caches).forEach(key => {
      this.remove(key)
    })
  }
}

export default new Timeout()
