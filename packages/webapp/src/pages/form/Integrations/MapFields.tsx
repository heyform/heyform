import { helper } from '@heyform-inc/utils'
import { IconArrowRight, IconPlus, IconX } from '@tabler/icons-react'
import { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Select, SelectProps } from '@/components'

interface MapFieldsProps {
  name: string
  label: string
  description?: string
  required?: boolean
  footer?: ReactNode

  leftType?: SelectProps['type']
  leftLoading?: boolean
  leftOptions?: any[]
  leftValueKey?: string
  leftLabelKey?: string
  leftPlaceholder?: string

  rightType?: SelectProps['type']
  rightLoading?: boolean
  rightOptions?: any[]
  rightValueKey?: string
  rightLabelKey?: string
  rightPlaceholder?: string

  filter?: (
    value: any,
    leftOptions: any[],
    rightOptions: any[]
  ) => { leftOptions: any[]; rightOptions: any[] }
}

export const MapFields: FC<MapFieldsProps> = ({
  name,
  label,
  description,
  required = true,
  leftType,
  leftLoading,
  leftOptions = [],
  leftValueKey,
  leftLabelKey,
  leftPlaceholder,
  rightType,
  rightLoading,
  rightOptions = [],
  rightValueKey,
  rightLabelKey,
  rightPlaceholder,
  filter
}) => {
  const { t } = useTranslation()

  return (
    <Form.List
      name={name}
      validateTrigger="onSubmit"
      rules={
        required
          ? [
              {
                validator: async (_, value) => {
                  if (value.length < 1) {
                    throw new Error(t('form.integrations.mapFields.required'))
                  }

                  for (let index = 0; index < value.length; index++) {
                    const row = value[index]
                    const isLeftEmpty = helper.isNil(row[0])
                    const isRightEmpty = helper.isNil(row[1])

                    if (isLeftEmpty || isRightEmpty) {
                      const error = isLeftEmpty
                        ? 'form.integrations.mapFields.requireLeft'
                        : 'form.integrations.mapFields.requireRight'

                      throw new Error(t(error, { index: index + 1 }))
                    }
                  }
                }
              }
            ]
          : undefined
      }
    >
      {(fields, { add, remove }, { errors }) => {
        return (
          <div>
            {label && (
              <label
                htmlFor={name as string}
                className="select-none text-base/6 font-medium sm:text-sm/6"
                data-slot="label"
              >
                {label}
              </label>
            )}

            {description && (
              <div className="text-base/5 text-secondary sm:text-sm/5" data-slot="description">
                {description}
              </div>
            )}

            <div className="mt-2 space-y-4 divide-y divide-accent-light sm:space-y-1 sm:divide-y-0">
              {fields.map((field, index) => (
                <Form.Field {...field} key={field.key}>
                  {({ value, onChange }) => {
                    const handleLeftChange = (left: any) => {
                      onChange([left, value[1]])
                    }

                    const handleRightChange = (right: any) => {
                      onChange([value[0], right])
                    }

                    function handleRemoveField() {
                      remove(index)
                    }

                    const options = (() => {
                      if (!filter) {
                        return {
                          leftOptions,
                          rightOptions
                        }
                      }

                      return filter(value, leftOptions, rightOptions)
                    })()

                    return (
                      <div className="flex items-center pt-4 sm:pt-0">
                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[17.5rem_2rem_17.5rem] sm:gap-3">
                          <div className="w-full">
                            <Select
                              className="h-11 w-full sm:h-10 [&_[data-slot=value]]:block [&_[data-slot=value]]:text-left"
                              contentProps={{
                                position: 'popper',
                                className: '[&_[data-slot=item]]:whitespace-pre-wrap'
                              }}
                              type={leftType}
                              value={value[0]}
                              options={options.leftOptions}
                              valueKey={leftValueKey}
                              labelKey={leftLabelKey}
                              placeholder={t(leftPlaceholder as Any)}
                              loading={leftLoading}
                              disabled={leftLoading}
                              onChange={handleLeftChange}
                            />
                          </div>

                          <div className="mx-1.5 hidden py-2.5 sm:block">
                            <IconArrowRight className="h-5 w-5 text-secondary" />
                          </div>

                          <div className="w-full">
                            {rightOptions ? (
                              <Select
                                className="h-11 w-full sm:h-10"
                                contentProps={{
                                  position: 'popper',
                                  className: '[&_[data-slot=item]]:whitespace-pre-wrap'
                                }}
                                type={rightType}
                                value={value[1]}
                                options={options.rightOptions}
                                valueKey={rightValueKey}
                                labelKey={rightLabelKey}
                                placeholder={rightPlaceholder}
                                loading={rightLoading}
                                disabled={rightLoading}
                                onChange={handleRightChange}
                              />
                            ) : (
                              <Input
                                className="w-full"
                                value={value[1]}
                                placeholder={rightPlaceholder}
                                onChange={handleRightChange}
                              />
                            )}
                          </div>
                        </div>

                        {fields.length > 1 && (
                          <Button.Link className="text-secondary" size="sm" iconOnly>
                            <IconX className="h-5 w-5" onClick={handleRemoveField} />
                          </Button.Link>
                        )}
                      </div>
                    )
                  }}
                </Form.Field>
              ))}
            </div>

            <div className="mt-2">
              <Button.Link size="sm" className="!px-0" onClick={() => add([])}>
                <IconPlus className="h-5 w-5 text-secondary" />
                {t('form.integrations.mapFields.addMore')}
              </Button.Link>
            </div>

            {errors.length > 0 && <div className="text-sm/6 text-error">{errors[0]}</div>}
          </div>
        )
      }}
    </Form.List>
  )
}
