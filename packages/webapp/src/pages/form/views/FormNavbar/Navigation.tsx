import { IconBolt, IconChartBar, IconDatabase, IconEdit, IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { useParam } from '@/utils'

export const Navigation = () => {
  const { t } = useTranslation()
  const { workspaceId, projectId, formId } = useParam()

  const LINKS = [
    {
      to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/create`,
      label: t('form.create'),
      icon: IconEdit
    },
    {
      to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/connect`,
      label: t('form.connect'),
      icon: IconBolt
    },
    {
      to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/analytics`,
      label: t('form.analytics'),
      icon: IconChartBar
    },
    {
      to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/submissions`,
      label: t('form.submissions'),
      icon: IconDatabase
    },
    {
      to: `/workspace/${workspaceId}/project/${projectId}/form/${formId}/settings`,
      label: t('form.settings'),
      icon: IconSettings
    }
  ]

  return (
    <div
      role="navigation"
      className="flex flex-col items-center justify-center gap-2 text-sm md:flex-row md:gap-6 md:text-xs"
    >
      {LINKS.map((link, index) => (
        <NavLink
          key={index}
          to={link.to}
          className="flex w-full items-center py-2 text-slate-700 hover:text-[#0252d7] md:w-auto md:flex-col md:py-0"
        >
          <link.icon className="mr-3 h-5 w-5 md:mx-auto md:mb-1" />
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}
