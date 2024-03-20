import { ComponentProps, ForwardedRef, forwardRef } from 'react'

export const Region = forwardRef(function Region(
  props: ComponentProps<any>,
  ref: ForwardedRef<SVGPathElement>
) {
  return <path ref={ref} {...props} />
})
