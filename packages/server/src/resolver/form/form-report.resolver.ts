import { FieldKindEnum, STATEMENT_FIELD_KINDS } from '@heyform-inc/shared-types-enums'

import { Auth, Form, FormGuard } from '@decorator'
import { FormDetailInput, FormReportType } from '@graphql'
import { OTHER_CHOICE_ID, flattenFields } from '@heyform-inc/answer-utils'
import { FormModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { FormReportService, SubmissionService } from '@service'
import { OTHER_REPORT_FIELD_KINDS } from '@utils'

const EXCLUDE_KINDS = [
  FieldKindEnum.GROUP,

  ...STATEMENT_FIELD_KINDS,

  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,
  FieldKindEnum.LEGAL_TERMS,

  FieldKindEnum.RATING,
  FieldKindEnum.OPINION_SCALE,

  'custom_single',
  'custom_multiple'
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
    const fields = flattenFields(form.fields)
    const fieldIds = fields
      .filter(field => !EXCLUDE_KINDS.includes(field.kind))
      .map(field => field.id)

    const [result, submissions] = await Promise.all([
      this.formReportService.findById(input.formId),
      this.submissionService.findAllGroupInFieldIds(input.formId, fieldIds)
    ])

    // Reports saved before "Other" was counted have no Other row; rebuild them in the background.
    // Check every choice question, since answers given before "Other" was turned off still count.
    const isMissingOther = fields.some(
      field =>
        OTHER_REPORT_FIELD_KINDS.includes(field.kind) &&
        result?.responses?.some(
          row => row.id === field.id && !row.chooses?.some(choose => choose.id === OTHER_CHOICE_ID)
        )
    )

    if (isMissingOther) {
      await this.formReportService.addQueue(input.formId)
    }

    return {
      responses: result?.responses || [],
      submissions
    } as any
  }
}
