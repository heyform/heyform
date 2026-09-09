import { BadRequestException } from '@nestjs/common'

import { Auth, FormGuard } from '@decorator'
import { UpdateFormThemeInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormService } from '@service'
import { isSafeCSSValue, isSafeCustomCSS } from '@utils'

@Resolver()
@Auth()
export class UpdateFormThemeResolver {
  constructor(private readonly formService: FormService) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async updateFormTheme(@Args('input') input: UpdateFormThemeInput): Promise<boolean> {
    if (!isSafeCustomCSS(input.theme?.customCSS)) {
      throw new BadRequestException('Custom CSS contains unsafe HTML characters')
    }

    if (!isSafeCSSValue(input.theme?.backgroundImage)) {
      throw new BadRequestException('Background image value contains unsafe CSS characters')
    }

    const colorValues = [
      input.theme?.questionTextColor,
      input.theme?.answerTextColor,
      input.theme?.buttonBackground,
      input.theme?.buttonTextColor,
      input.theme?.backgroundColor
    ]

    if (colorValues.some(value => !isSafeCSSValue(value))) {
      throw new BadRequestException('Theme color value contains unsafe CSS characters')
    }

    return await this.formService.update(input.formId, {
      'themeSettings.logo': input.logo ?? null,
      'themeSettings.theme': input.theme,
      ...(input.favicon !== undefined ? { 'themeSettings.favicon': input.favicon } : {})
    })
  }
}
