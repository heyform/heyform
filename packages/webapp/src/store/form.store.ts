import { htmlUtils } from '@heyform-inc/answer-utils'
import { FormSettings, FormTheme } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import dayjs, { Dayjs, unix } from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { makeAutoObservable } from 'mobx'

import { getTheme } from '@/components/formComponents'
import type { FormModel } from '@/models'

interface TempFormSettings extends FormSettings {
  closeForm?: boolean
  startDate?: Dayjs
  endDate?: Dayjs
}

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(dayOfYear)

export class FormStore {
  activeFormId?: string

  current?: FormModel = {} as any

  customTheme?: FormTheme = {} as any

  tempSettings: Partial<TempFormSettings> = {}

  constructor() {
    makeAutoObservable(this)
  }

  get theme() {
    return getTheme(this.current?.themeSettings?.theme)
  }

  get fields() {
    if (helper.isValidArray(this.current?.fields)) {
      return this.current!.fields!.map(f => {
        f.title = helper.isArray(f.title)
          ? htmlUtils.plain(htmlUtils.serialize(f.title as any))
          : f.title
        return f
      })
    }
    return []
  }

  setCurrent(form?: FormModel) {
    this.current = form || ({} as any)
    this.customTheme = getTheme(form?.themeSettings?.theme)

    if (form?.settings) {
      const tempSettings: TempFormSettings = {
        closeForm: !form.settings.active,
        ...form.settings
      }

      if (!form.settings.expirationTimeZone) {
        tempSettings.expirationTimeZone = dayjs.tz.guess()
      }

      if (form.settings.enabledAt && form.settings.enabledAt > 0) {
        tempSettings.startDate = unix(form.settings.enabledAt).tz(tempSettings.expirationTimeZone)
      }

      if (form.settings.closedAt && form.settings.closedAt > 0) {
        tempSettings.endDate = unix(form.settings.closedAt).tz(tempSettings.expirationTimeZone)
      }

      if (!form.settings.locale) {
        tempSettings.locale = 'en'
      }

      this.tempSettings = tempSettings
    }
  }

  updateCustomTheme(updates: IMapType) {
    this.customTheme = getTheme({
      ...this.customTheme,
      ...updates
    })
  }

  resetCustomTheme() {
    this.customTheme = this.theme
  }

  selectForm(formId?: string) {
    this.activeFormId = formId
  }

  update(values: IMapType) {
    this.current = {
      ...this.current!,
      ...values
    }
  }

  updateSettings(values: IMapType) {
    this.current!.settings = {
      ...this.current!.settings,
      ...values
    }
  }

  updateTempSettings(updates: IMapType) {
    this.tempSettings = {
      ...this.tempSettings,
      ...updates
    }
  }
}
