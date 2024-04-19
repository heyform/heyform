const LOADED_SCRIPTS = new Set<string>()

export function loadScript(
  name: string,
  src: string,
  callback: (err?: Error) => void,
  maxAttempts = 3
) {
  if (LOADED_SCRIPTS.has(src)) {
    return callback()
  }

  let script = document.getElementById(name) as HTMLScriptElement

  if (!script) {
    script = document.createElement('script')
    script.id = name
    script.src = src
    document.head.appendChild(script)
  }

  script.onload = () => {
    LOADED_SCRIPTS.add(src)
    callback()
  }

  script.onerror = () => {
    script.onload = null
    script.onerror = null
    document.head.removeChild(script)

    if (maxAttempts <= 0) {
      return callback(new Error(`Failed to load script ${name}`))
    }

    maxAttempts -= 1

    setTimeout(() => {
      loadScript(name, src, callback, maxAttempts)
    }, 50)
  }
}
