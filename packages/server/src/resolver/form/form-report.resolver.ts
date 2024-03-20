import { Args, Query, Resolver } from '@nestjs/graphql'

import { flattenFields } from '@heyform-inc/answer-utils'
import { FieldKindEnum, STATEMENT_FIELD_KINDS } from '@heyform-inc/shared-types-enums'

import { Auth, Form, FormGuard } from '@decorator'
import { FormDetailInput, FormReportType } from '@graphql'
import { FormModel } from '@model'
import { FormReportService, SubmissionService } from '@service'

const EXCLUDE_KINDS = [
  // Not question
  FieldKindEnum.GROUP,
  // FieldKindEnum.STATEMENT,
  // FieldKindEnum.DIVIDER,
  // FieldKindEnum.PAGE_BREAK,
  ...STATEMENT_FIELD_KINDS,

  // Choice
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,
  FieldKindEnum.LEGAL_TERMS,

  // Rating
  FieldKindEnum.RATING,
  FieldKindEnum.OPINION_SCALE,

  // Custom choice
  FieldKindEnum.CUSTOM_SINGLE,
  FieldKindEnum.CUSTOM_MULTIPLE
]

@Resolver()
@Auth()
export class FormReportResolver {
  constructor(
    private readonly formReportService: FormReportService,
    private readonly submissionService: SubmissionService
  ) {}

  @Query(returns => FormReportType)
  @FormGuard()
  async formReport(
    @Form() form: FormModel,
    @Args('input') input: FormDetailInput
  ): Promise<FormReportType> {
    const fieldIds = flattenFields(form.fields)
      .filter(field => !EXCLUDE_KINDS.includes(field.kind))
      .map(field => field.id)

    const [result, submissions] = await Promise.all([
      this.formReportService.findById(input.formId),
      this.submissionService.findAllGroupInFieldIds(input.formId, fieldIds)
    ])

    return {
      responses: result?.responses || [],
      submissions
    } as any
  }
}
