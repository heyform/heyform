import { helper } from '@heyform-inc/utils'
import throttle from 'lodash/throttle'
import { FC, useCallback, useEffect, useState } from 'react'

import { cn } from '@/utils'

interface AnchorNavigationProps extends ComponentProps {
  menus: Array<{
    label: string
    value: string
  }>
}

export const AnchorNavigation: FC<AnchorNavigationProps> = ({ className, menus }) => {
  const [hash, setHash] = useState<string>(menus[0].value)

  function handleHashChange() {
    let newHash = window.location.hash.replace(/^#/, '')

    if (helper.isEmpty(newHash)) {
      newHash = menus[0].value
    }

    setHash(newHash)
  }

  const handleScroll = useCallback(
    throttle(() => {
      let visibleElements: HTMLDivElement[] = []
      const elements = menus.map(m => document.getElementById(m.value) as HTMLDivElement)

      elements.forEach(el => {
        const rect = el.getBoundingClientRect()

        if (
          rect.bottom >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        ) {
          visibleElements.push(el)
        }
      })

      if (helper.isValid(visibleElements)) {
        visibleElements = visibleElements.sort(
          (a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom
        )

        setHash(visibleElements[0].id)
      }
    }, 200),
    []
  )

  useEffect(() => {
    handleHashChange()
    handleScroll()

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.addEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <nav
      className={cn(
        'scrollbar sticky top-10 flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className
      )}
    >
      {menus.map(m => (
        <a
          key={m.value}
          className="inline-flex h-8 items-center justify-start whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-accent-light data-[state=inactive]:hover:bg-accent-light"
          href={`#${m.value}`}
          data-state={hash === m.value ? 'active' : 'inactive'}
        >
          {m.label}
        </a>
      ))}
    </nav>
  )
}
