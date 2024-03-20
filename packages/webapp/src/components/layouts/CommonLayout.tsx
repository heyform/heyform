import type { FC } from 'react'

export const CommonLayout: FC<IComponentProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">{children}</div>
    </div>
  )
}
