export function sendHideModalMessage() {
  window.parent?.postMessage(
    {
      source: 'HEYFORM',
      eventName: 'HIDE_EMBED_MODAL'
    },
    '*'
  )
}
