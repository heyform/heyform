import type { FormField } from '@heyform-inc/shared-types-enums'
import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import type { FC } from 'react'
import { useMemo } from 'react'
import { ReactSortable } from 'react-sortablejs'

import { useStoreContext } from '../../store'
import { FieldCard } from './FieldCard'

export const FieldList: FC = () => {
  const { state, dispatch } = useStoreContext()

  const data = useMemo(() => {
    let welcome: FormField | null = null
    let thankYou: FormField | null = null
    const fields: FormField[] = []

    for (const field of state.fields) {
      if (field.kind === FieldKindEnum.WELCOME) {
        welcome = field
      } else if (field.kind === FieldKindEnum.THANK_YOU) {
        thankYou = field
      } else {
        fields.push(field)
      }
    }

    return {
      welcome,
      fields,
      thankYou
    }
  }, [state.fields])
  const isDeleteEnabled = useMemo(() => state.questions.length > 1, [state.questions])

  function handleSortStart(event: any) {
    dispatch({
      type: 'selectField',
      payload: {
        id: data.fields[event.oldIndex].id
      }
    })
  }

  function handleSortFields(fields: FormField[]) {
    dispatch({
      type: 'setFields',
      payload: {
        fields: [data.welcome, ...fields, data.thankYou].filter(helper.isValid) as FormField[]
      }
    })
  }

  // Hack for jsx rerender
  const sortable = useMemo(
    () => (
      <ReactSortable
        ghostClass="field-card-ghost"
        chosenClass="field-card-chosen"
        dragClass="field-card-dragging"
        fallbackClass="field-card-cloned"
        list={data.fields}
        setList={handleSortFields}
        onStart={handleSortStart}
        group={{
          name: 'root',
          put: ['nested'],
          pull: true
        }}
        delay={10}
        animation={240}
      >
        {data.fields.map(field => (
          <FieldCard
            key={field.id}
            field={field}
            selectedId={state.selectedId}
            isDeleteEnabled={isDeleteEnabled}
          />
        ))}
      </ReactSortable>
    ),
    [data.fields, state.selectedId]
  )

  return (
    <div className="scrollbar h-full">
      {data.welcome && (
        <FieldCard
          field={data.welcome}
          selectedId={state.selectedId}
          isDeleteEnabled={isDeleteEnabled}
        />
      )}
      <div className="field-list">{sortable}</div>
      {data.thankYou && (
        <FieldCard
          field={data.thankYou}
          selectedId={state.selectedId}
          isDeleteEnabled={isDeleteEnabled}
        />
      )}
    </div>
  )
}
