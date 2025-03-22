import type { CSSProperties, ClipboardEvent } from 'react'

export interface RichTextTriggerSelection {
  anchorNode: Node
  startOffset?: number
  endOffset?: number
  rect?: DOMRect
}

export interface RichTextPreceding {
  isTriggering: boolean
  text?: string
}

export function placeCaretAtEnd(el: HTMLElement) {
  // Do not move caret if element was not focused
  const isTargetFocused = document.activeElement === el

  if (el && !isTargetFocused) {
    const selection = window.getSelection()

    if (selection) {
      const range = document.createRange()

      range.selectNodeContents(el)
      range.collapse(false)

      selection.removeAllRanges()
      selection.addRange(range)
    }

    el.focus()
  }
}

export function getCharInText(text: string, offset = 1) {
  const arr = text.split('')
  const pos = offset > 0 ? offset : arr.length + offset

  return arr[pos]
}

export function getTriggerSelection(): RichTextTriggerSelection | undefined {
  const selection = window.getSelection()

  if (selection) {
    const anchorNode = selection.anchorNode

    if (anchorNode != null) {
      const range = selection.getRangeAt(0)
      // getRangeAt may not exist, need alternative
      const startOffset = range.cloneRange().startOffset

      // Hack https://stackoverflow.com/a/62474614
      let rect = range.getBoundingClientRect()

      if (range.collapsed && rect.top === 0 && rect.left === 0) {
        const tmpNode = document.createTextNode('\ufeff')
        range.insertNode(tmpNode)

        rect = range.getBoundingClientRect()
        tmpNode.remove()
      }

      return {
        anchorNode,
        startOffset,
        rect
      }
    }
  }
}

export function getSelectionText() {
  const triggerSelection = getTriggerSelection()

  if (triggerSelection) {
    const { anchorNode, startOffset } = triggerSelection

    if (anchorNode) {
      const content = anchorNode.textContent

      if (content && startOffset! > 0) {
        return content.substring(0, startOffset!)
      }
    }
  }
}

export function getTextPrecedingAtTrigger(
  trigger: string,
  startOffset?: number
): RichTextPreceding {
  const result: RichTextPreceding = {
    isTriggering: false
  }

  if (!startOffset || startOffset < 1) {
    return result
  }

  const text = getSelectionText()

  if (
    !text ||
    // check is the trigger character has been deleted
    text[startOffset! - 1] !== trigger ||
    // check if there is a space behind the trigger character
    text[startOffset!]?.trim() === ''
  ) {
    return result
  }

  result.isTriggering = true
  result.text = text!.substring(startOffset!)

  return result
}

export function getCaretRect(selectedNodePosition: number) {
  const selection = window.getSelection()

  if (selection && selection.anchorNode) {
    const range = selection.getRangeAt(selectedNodePosition)
    return range.getBoundingClientRect()
  }
}

export function insertClipboardText(event: any) {
  const clipboardData = event.clipboardData.getData('text/plain').trim().replace(/\r|\n/g, ' ')
  document.execCommand('insertText', false, clipboardData)
}

export function insertClipboardHTML(event: ClipboardEvent) {
  document.execCommand('insertHTML', false, event.clipboardData.getData('text'))
}

export function replaceTriggerText(
  target: HTMLElement,
  triggerSelection: RichTextTriggerSelection,
  template: string
) {
  const selection = window.getSelection()

  if (selection) {
    let range = document.createRange()

    range.setStart(triggerSelection.anchorNode, triggerSelection.startOffset!)
    range.setEnd(triggerSelection.anchorNode, triggerSelection.endOffset!)
    range.deleteContents()

    const temp = document.createElement('span')
    temp.innerHTML = template

    const nodes = Array.from(temp.childNodes)
    const lastNode = nodes[nodes.length - 1]
    const frag = document.createDocumentFragment()

    nodes.forEach(node => {
      frag.appendChild(node)
    })

    range.insertNode(frag)

    // Preserve the selection
    range = range.cloneRange()
    range.setStartAfter(lastNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    target.focus()
  }
}

export function pasteHtml(
  ref: HTMLElement,
  anchorNode: Node,
  startOffset: number,
  endOffset: number,
  html: string
) {
  const selection = window.getSelection()

  if (selection) {
    let range = document.createRange()

    range.setStart(anchorNode, startOffset)
    range.setEnd(anchorNode, endOffset)
    range.deleteContents()

    const el = document.createElement('div')
    el.innerHTML = html

    const nodes = Array.from(el.childNodes)
    const lastNode = nodes[nodes.length - 1]
    const frag = document.createDocumentFragment()

    nodes.forEach(node => {
      frag.appendChild(node)
    })

    range.insertNode(frag)

    // Preserve the selection
    range = range.cloneRange()
    range.setStartAfter(lastNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    ref.focus()
  }
}

export function getStyleFromRect(rect: DOMRect): CSSProperties {
  let style: CSSProperties = {}

  const edge = 100
  const windowHeight = window.innerHeight
  const top = rect.top + rect.height

  if (top > windowHeight / 2) {
    style = {
      left: rect.left,
      bottom: windowHeight - rect.top,
      maxHeight: rect.top - edge
    }
  } else {
    style = {
      top,
      left: rect.left,
      maxHeight: windowHeight - top - edge
    }
  }

  return style
}

export function getRangeSelection(range: Range): Selection | null {
  const sel = window.getSelection()

  sel!.removeAllRanges()
  sel!.addRange(range)

  return sel
}
