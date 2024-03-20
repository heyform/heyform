import { helper, pickValidValues } from '@heyform-inc/utils'
import { autorun, set, toJS } from 'mobx'
import store2 from 'store2'

export function mobxStorage(storeInstance: any, storeName: string, fields?: string[]) {
  const cache = store2.get(storeName)

  if (helper.isValid(cache)) {
    set(storeInstance, cache)
  }

  autorun(() => {
    let value = toJS(storeInstance)

    if (helper.isValid(fields)) {
      value = pickValidValues(value, fields!)
    }

    store2.set(storeName, value)
  })
}
