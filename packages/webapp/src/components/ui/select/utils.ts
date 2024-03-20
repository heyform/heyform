import { helper } from '@heyform-inc/utils'

import { IOptionGroupType, IOptionType } from '../typing'

function contains(value: unknown, keyword: string): boolean {
  return !helper.isNil(value) && String(value).toLowerCase().includes(keyword.toLowerCase())
}

export function flattenOptions(
  options: IOptionType[] | IOptionGroupType[],
  keyword?: string,
  labelKey = 'label'
): IOptionType[] {
  let result: IOptionType[] = []
  const isValidKeyword = helper.isValid(keyword)

  options.forEach((option, index) => {
    if (helper.isValidArray(option.children)) {
      let children = (option as IOptionGroupType).children

      if (isValidKeyword) {
        children = children.filter(child => {
          return contains(child[labelKey], keyword!)
        })
      }

      if (children.length > 0) {
        result = [
          ...result,
          {
            [labelKey]: option.group,
            isGroup: true
          },
          ...children
        ] as IOptionType[]
      }
    } else {
      let optionItem: IOptionType | null = option as IOptionType

      if (isValidKeyword) {
        optionItem = contains(optionItem[labelKey], keyword!) ? optionItem : null
      }

      if (optionItem) {
        result.push(optionItem)
      }
    }
  })

  return result
}
