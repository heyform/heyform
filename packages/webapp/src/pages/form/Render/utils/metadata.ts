export function setFormMetadata(name?: string, favicon?: string | null) {
  const originalTitle = document.title
  document.title = name || 'HeyForm'

  const previousIcons: Array<{ element: HTMLLinkElement; rel: string }> = []
  let icon: HTMLLinkElement | undefined

  if (favicon && /^https?:\/\//i.test(favicon)) {
    document.head
      .querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="mask-icon"]')
      .forEach(element => {
        previousIcons.push({ element, rel: element.rel })
        element.removeAttribute('rel')
      })
    icon = document.createElement('link')
    icon.rel = 'icon'
    icon.href = favicon
    document.head.appendChild(icon)
  }

  return () => {
    document.title = originalTitle
    icon?.remove()
    previousIcons.forEach(({ element, rel }) => {
      element.rel = rel
    })
  }
}
