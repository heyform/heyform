import type { FC } from 'react'

export const TableIcon: FC<IComponentProps<HTMLOrSVGElement>> = props => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <g fill="none" fillRule="evenodd">
        <rect width="24" height="24" />
        <g transform="translate(3 3)">
          <rect width="18" height="18" stroke="currentColor" strokeWidth="2" rx="1" />
          <rect
            width="15.75"
            height="2.25"
            x="1.125"
            y="4.5"
            fill="currentColor"
            fillRule="nonzero"
          />
          <rect
            width="15.75"
            height="2.25"
            x="1.125"
            y="11.25"
            fill="currentColor"
            fillRule="nonzero"
          />
          <rect
            width="2.25"
            height="15.75"
            x="4.5"
            y="1.125"
            fill="currentColor"
            fillRule="nonzero"
          />
          <rect
            width="2.25"
            height="15.75"
            x="11.25"
            y="1.125"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </g>
    </svg>
  )
}
