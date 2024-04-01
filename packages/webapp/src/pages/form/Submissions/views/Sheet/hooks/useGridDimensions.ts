import { useLayoutEffect, useRef, useState } from 'react'

export function useGridDimensions(): [
  ref: React.RefObject<HTMLDivElement>,
  width: number,
  height: number
] {
  const gridRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(1)
  const [gridHeight, setGridHeight] = useState(1)

  useLayoutEffect(() => {
    const { ResizeObserver } = window

    // don't break in jest/jsdom and browsers that don't support ResizeObserver
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (ResizeObserver == null) return

    const resizeObserver = new ResizeObserver(() => {
      // Get dimensions without scrollbars.
      // The dimensions given by the callback entries in Firefox do not subtract the scrollbar sizes.
      const { clientWidth, clientHeight } = gridRef.current!
      setGridWidth(clientWidth)
      setGridHeight(clientHeight)
    })

    resizeObserver.observe(gridRef.current!)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return [gridRef, gridWidth, gridHeight]
}
