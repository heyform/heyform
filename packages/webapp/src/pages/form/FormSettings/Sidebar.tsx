import clsx from 'clsx'
import { FC, startTransition, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SIDEBAR_LINK_OPTIONS = [
  {
    label: 'formSettings.status',
    value: 'form-settings-status'
  },
  {
    label: 'formSettings.Basic',
    value: 'form-settings-basic'
  },
  {
    label: 'formSettings.Protection',
    value: 'form-settings-protection'
  }
]

const SidebarLink: FC<IOptionType & { active?: string }> = ({ label, value, active }) => {
  const { t } = useTranslation()

  return (
    <a
      className={clsx(
        'block cursor-pointer rounded px-3 py-2 text-slate-900 hover:bg-slate-100 hover:text-slate-900',
        {
          'bg-slate-100': active === value
        }
      )}
      href={`#${value}`}
    >
      {t(label as string)}
    </a>
  )
}

export const Sidebar: FC = () => {
  const [active, setActive] = useState(SIDEBAR_LINK_OPTIONS[0].value)

  useEffect(() => {
    const element = document.querySelector('.form-content-container')!
    const elementRect = element.getBoundingClientRect()
    const selections = Array.from(element.querySelectorAll('.form-settings-selection'))

    function handleScroll() {
      for (const selection of selections) {
        const rect = selection.getBoundingClientRect()

        if (element!.scrollTop < rect.top - elementRect.top + rect.height) {
          updateActive(selection.getAttribute('id')!)
          break
        }
      }
    }

    function updateActive(newActive: string) {
      startTransition(() => {
        setActive(newActive)
      })
    }

    element.addEventListener('scroll', handleScroll, false)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="hidden w-64 md:block">
      <div className="sticky top-14 mt-14">
        <div className="space-y-1">
          {SIDEBAR_LINK_OPTIONS.map((row, index) => (
            <SidebarLink key={index} label={row.label} value={row.value} active={active} />
          ))}
        </div>
      </div>
    </div>
  )
}
