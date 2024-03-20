import type { FC } from 'react'

export const EdgeArrow: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg
      width="0"
      height="0"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        opacity: 0
      }}
      {...props}
    >
      <defs>
        <marker
          id="edge-marker-arrow"
          markerWidth="6.4"
          markerHeight="11.2"
          viewBox="0 0 8 14"
          orient="auto"
          refX="6"
          refY="7"
          fill="#1f2937"
        >
          <path d="M.707 3.121L3.586 6l.992.988L3.586 8 .707 10.879a2 2 0 000 2.828L7.414 7 .707.293a2 2 0 000 2.828z"></path>
        </marker>
      </defs>
    </svg>
  )
}
