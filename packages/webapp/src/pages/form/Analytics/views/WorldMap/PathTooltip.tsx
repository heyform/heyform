import { FC, RefObject, createRef, useEffect, useState } from 'react'

interface PathTooltipProps {
  text: string
  textColor: string
  backgroundColor: string
  pathRef: RefObject<SVGElement>
  svgRef: RefObject<SVGSVGElement>
}

export const PathTooltip: FC<PathTooltipProps> = ({
  text,
  textColor,
  backgroundColor,
  pathRef,
  svgRef
}) => {
  const [hidden, setHidden] = useState(true)
  const [tooltipRect, setTooltipRect] = useState({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    isLeft: false,
    isTop: false
  })
  const textRef = createRef<SVGTextElement>()

  function handleMouseover() {
    setHidden(false)
  }

  function handleMouseleave() {
    setHidden(true)
  }

  function handleMousemove(e: any) {
    if (
      !hidden &&
      svgRef &&
      pathRef &&
      textRef &&
      svgRef.current &&
      pathRef.current &&
      textRef.current
    ) {
      const svgRect = svgRef.current.getBoundingClientRect()
      const textRect = textRef.current.getBoundingClientRect()

      const isLeft = e.x - svgRect.x > svgRect.width / 2
      const isTop = e.y - svgRect.y > svgRect.height / 2

      const w = textRect.width + 28
      const h = textRect.height + 14
      const x = isLeft ? e.x - svgRect.x + 8 - w : e.x - svgRect.x - 8
      const y = isTop ? e.y - svgRect.y - 12 - h : e.y - svgRect.y + 8

      setTooltipRect({ x: x, y: y, w: w, h: h, isLeft: isLeft, isTop: isTop })
    }
  }

  // use effect to handle mouse over and mouse leave
  useEffect(() => {
    if (pathRef && pathRef.current) {
      pathRef.current.addEventListener('mouseover', handleMouseover)
      pathRef.current.addEventListener('mouseleave', handleMouseleave)
      pathRef.current.addEventListener('mousemove', handleMousemove)
    }

    return () => {
      if (pathRef && pathRef.current) {
        pathRef.current.removeEventListener('mouseover', handleMouseover)
        pathRef.current.removeEventListener('mouseleave', handleMouseleave)
        pathRef.current.removeEventListener('mousemove', handleMousemove)
      }
    }
  }, [pathRef, svgRef, textRef, hidden])

  return (
    <g pointerEvents="none">
      <rect
        x={tooltipRect.x}
        y={tooltipRect.y}
        rx={12}
        ry={12}
        width={tooltipRect.w}
        height={tooltipRect.h}
        fill={backgroundColor}
        visibility={hidden ? 'hidden' : 'visible'}
      />
      <text
        ref={textRef}
        x={tooltipRect.x + 14}
        y={tooltipRect.y + 20}
        fill={textColor}
        cursor="default"
        visibility={hidden ? 'hidden' : 'visible'}
      >
        {text}
      </text>
    </g>
  )
}
