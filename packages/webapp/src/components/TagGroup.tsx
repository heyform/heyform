import clsx from 'clsx'
import { FC } from 'react'

const COLOR_PALETTE = [
  '#fde2e2',
  '#feead2',
  '#faf1d1',
  '#eef6c6',
  '#d9f5d6',
  '#ccf6f1',
  '#d9f3fd',
  '#e1eaff',
  '#fdddef',
  '#ece2fe',
  '#eff0f1',
  '#fbbfbc',
  '#fed4a4',
  '#f8e6ab',
  '#dfee96',
  '#b7edb1',
  '#a9efe6',
  '#b1e8fc',
  '#bacefd',
  '#f9aed9',
  '#cdb2fa',
  '#dee0e3',
  '#f98e8a',
  '#ffb25a',
  '#fad96e',
  '#c9e053',
  '#8ee085',
  '#73eada',
  '#7edafb',
  '#8eaffc',
  '#f687c6',
  '#bd9bf8',
  '#bec2c6'
]

interface TagGroupProps extends IComponentProps {
  tags: Array<{
    label: string
  }>
}

export const TagGroup: FC<TagGroupProps> = ({ className, style, tags }) => {
  return (
    <div className={clsx('-mb-1 leading-[1]', className)} style={style}>
      {tags.map((tag, index) => (
        <div
          key={index}
          className="mb-1 mr-2 inline-block rounded-md px-2 py-1 text-sm text-slate-900"
          style={{
            backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length]
          }}
        >
          {tag.label}
        </div>
      ))}
    </div>
  )
}
