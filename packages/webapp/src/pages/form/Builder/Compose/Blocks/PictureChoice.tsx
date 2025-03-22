import { Button, Input, getChoiceKeyName } from '@heyform-inc/form-renderer'
import { Choice, ChoiceBadgeEnum } from '@heyform-inc/shared-types-enums'
import { clone, excludeObject, helper, nanoid } from '@heyform-inc/utils'
import {
  IconPencil,
  IconPhoto,
  IconPhotoPlus,
  IconPlus,
  IconTrash,
  IconX
} from '@tabler/icons-react'
import { FC, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactSortable } from 'react-sortablejs'

import { ImagePicker, ImagePickerRef } from '@/components'
import { cn } from '@/utils'

import { useStoreContext } from '../../store'
import type { BlockProps } from './Block'
import { Block } from './Block'

interface PictureChoiceItemProps {
  index: number
  choice: Choice
  isOther?: boolean
  badge?: ChoiceBadgeEnum
  enableRemove?: boolean
  onLabelChange?: (id: string, label: string) => void
  onSelectImage?: (id: string) => void
  onRemoveImage?: (id: string) => void
  onRemove: (id: string) => void
}

const PictureChoiceItem: FC<PictureChoiceItemProps> = ({
  choice,
  index,
  isOther,
  badge = ChoiceBadgeEnum.LETTER,
  enableRemove,
  onLabelChange,
  onSelectImage,
  onRemoveImage,
  onRemove
}) => {
  const { t } = useTranslation()
  const [isFocused, setIsFocused] = useState(false)

  function handleRemove() {
    onRemove(choice.id)
  }

  function handleLabelChange(value: any) {
    onLabelChange?.(choice.id, value)
  }

  function handleBlur() {
    setIsFocused(false)
  }

  function handleFocus() {
    setIsFocused(true)
  }

  function handleSelectImage() {
    onSelectImage?.(choice.id)
  }

  function handleRemoveImage() {
    onRemoveImage?.(choice.id)
  }

  return (
    <div className="heyform-radio">
      <div className="heyform-radio-container">
        {isOther ? (
          <div className="heyform-radio-trigger">
            <IconPencil />
          </div>
        ) : helper.isURL(choice.image) ? (
          <>
            <div className="heyform-radio-image">
              <img src={choice.image!} alt={choice.label} />
            </div>
            <div className="heyform-radio-actions">
              <Button.Link leading={<IconPhoto />} onClick={handleSelectImage} />
              <Button.Link leading={<IconTrash />} onClick={handleRemoveImage} />
            </div>
          </>
        ) : (
          <div className="heyform-radio-trigger" onClick={handleSelectImage}>
            <IconPhotoPlus />
          </div>
        )}

        <div className="heyform-radio-content">
          <div
            className={cn(
              'heyform-radio-hotkey',
              isOther ? null : 'heyform-multiple-choice-handle cursor-move'
            )}
          >
            {getChoiceKeyName(badge, index)}
          </div>
          <div className="heyform-radio-label">
            {isOther ? (
              <div className="heyform-radio-label-other">{choice.label}</div>
            ) : (
              <Input
                value={choice.label}
                placeholder={isFocused ? t('form.builder.compose.choicePlaceholder') : undefined}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onChange={handleLabelChange}
              />
            )}
          </div>
          {enableRemove && (
            <div className="heyform-radio-remove" onClick={handleRemove}>
              <IconX />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const AddPictureChoice: FC<ComponentProps> = props => {
  return (
    <div className="heyform-radio" {...props}>
      <div className="heyform-radio-container">
        <div className="heyform-radio-image flex-1">
          <IconPlus />
        </div>
      </div>
    </div>
  )
}

export const PictureChoice: FC<BlockProps> = ({ field, locale, ...restProps }) => {
  const { t } = useTranslation()

  const { dispatch } = useStoreContext()
  const imagePickerRef = useRef<ImagePickerRef | null>(null)
  const [choiceId, setChoiceId] = useState<string>()

  function handleSelectImage(id: string) {
    imagePickerRef.current?.open()
    setChoiceId(id)
  }

  function handleAddChoice() {
    const newChoiceId = nanoid(12)

    // Show image picker modal
    handleSelectImage(newChoiceId)

    // Create new choice
    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            choices: [
              ...(field.properties?.choices || []),
              {
                id: newChoiceId,
                label: ''
              }
            ]
          }
        }
      }
    })
  }

  function handleChoiceRemove(id: string) {
    const updates =
      id === 'other'
        ? {
            allowOther: false
          }
        : {
            choices: field.properties?.choices?.filter(c => c.id !== id)
          }

    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            ...updates
          }
        }
      }
    })
  }

  function handleLabelChange(id: string, label: string) {
    const choices = clone(field.properties?.choices || [])
    const index = choices.findIndex(c => c.id === id)

    choices[index].label = label

    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            choices
          }
        }
      }
    })
  }

  function handleImageChange(value?: string) {
    const choices = clone(field.properties?.choices || [])
    const index = choices.findIndex(c => c.id === choiceId)

    choices[index].image = value

    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            choices
          }
        }
      }
    })
  }

  function handleRemoveImage(cid: string) {
    const choices = clone(field.properties?.choices || [])
    const index = choices.findIndex(c => c.id === cid)

    delete choices[index].image

    dispatch({
      type: 'updateField',
      payload: {
        id: field.id,
        updates: {
          properties: {
            ...field.properties,
            choices
          }
        }
      }
    })
  }

  function handleClose(open: boolean) {
    if (!open) {
      setChoiceId(undefined)
    }
  }

  const handleAddChoiceCallback = useCallback(handleAddChoice, [field.properties])
  const handleChoiceRemoveCallback = useCallback(handleChoiceRemove, [field.properties])
  const handleLabelChangeCallback = useCallback(handleLabelChange, [field.properties])
  const handleSelectImageCallback = useCallback(handleSelectImage, [field.properties])
  const handleRemoveImageCallback = useCallback(handleRemoveImage, [field.properties])
  const handleImageChangeCallback = useCallback(handleImageChange, [field.properties, choiceId])

  const choices = useMemo(
    () => (helper.isValidArray(field.properties?.choices) ? clone(field.properties!.choices!) : []),
    [field.properties]
  )

  const handleSetList = useCallback(
    (newChoices: Choice[], sortable: any) => {
      if (sortable) {
        dispatch({
          type: 'updateField',
          payload: {
            id: field.id,
            updates: {
              properties: {
                ...field.properties,
                choices: newChoices.map(c => excludeObject(c, ['chosen', 'selected'])) as Choice[]
              }
            }
          }
        })
      }
    },
    [field.id, field.properties]
  )

  return (
    <Block className="heyform-picture-choice" field={field} locale={locale} {...restProps}>
      <ReactSortable
        className="heyform-picture-choice-list"
        ghostClass="heyform-multiple-choice-ghost"
        chosenClass="heyform-multiple-choice-chosen"
        dragClass="heyform-multiple-choice-dragging"
        fallbackClass="heyform-multiple-choice-cloned"
        handle=".heyform-multiple-choice-handle"
        list={choices}
        setList={handleSetList}
        delay={10}
        animation={240}
        fallbackOnBody
      >
        {field.properties?.allowOther ? (
          <>
            {field.properties?.choices?.map((choice, index) => (
              <PictureChoiceItem
                key={choice.id}
                index={index}
                choice={choice}
                badge={field.properties!.badge}
                enableRemove={field.properties!.choices!.length > 1}
                onLabelChange={handleLabelChangeCallback}
                onSelectImage={handleSelectImageCallback}
                onRemoveImage={handleRemoveImageCallback}
                onRemove={handleChoiceRemoveCallback}
              />
            ))}
            <PictureChoiceItem
              key="other"
              index={field.properties!.choices!.length}
              choice={
                {
                  id: 'other',
                  label: t('form.builder.compose.otherChoice')
                } as Choice
              }
              badge={field.properties!.badge}
              isOther={true}
              enableRemove={field.properties!.choices!.length > 1}
              onRemove={handleChoiceRemoveCallback}
            />

            <AddPictureChoice key="add-choice" onClick={handleAddChoiceCallback} />
          </>
        ) : (
          <>
            {field.properties?.choices?.map((choice, index) => (
              <PictureChoiceItem
                key={choice.id}
                index={index}
                choice={choice}
                badge={field.properties!.badge}
                enableRemove={field.properties!.choices!.length > 1}
                onLabelChange={handleLabelChangeCallback}
                onSelectImage={handleSelectImageCallback}
                onRemoveImage={handleRemoveImageCallback}
                onRemove={handleChoiceRemoveCallback}
              />
            ))}
            <AddPictureChoice key="add-choice" onClick={handleAddChoiceCallback} />
          </>
        )}
      </ReactSortable>

      <ImagePicker
        ref={imagePickerRef}
        tabs={['image', 'unsplash']}
        onOpenChange={handleClose}
        onChange={handleImageChangeCallback}
      />
    </Block>
  )
}
