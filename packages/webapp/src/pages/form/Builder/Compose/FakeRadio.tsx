import type { FC } from 'react'

interface FakeRadioProps extends ComponentProps {
  hotkey?: string
  label: string | number
}

export const FakeRadio: FC<FakeRadioProps> = ({ hotkey, label, ...restProps }) => {
  return (
    <div className="heyform-radio" {...restProps}>
      <div className="heyform-radio-container">
        <div className="heyform-radio-content">
          {hotkey && <div className="heyform-radio-hotkey">{hotkey}</div>}
          <div className="heyform-radio-label">{label}</div>
        </div>
      </div>
    </div>
  )
}
