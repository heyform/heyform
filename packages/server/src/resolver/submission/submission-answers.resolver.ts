import { Auth, FormGuard, Team } from '@decorator'
import { SubmissionAnswersInput, SubmissionAnswersType } from '@graphql'
import { TeamModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { SubmissionService } from '@service'

@Resolver()
@Auth()
export class SubmissionAnswersResolver {
  constructor(private readonly submissionService: SubmissionService) {}

  @Query(returns => SubmissionAnswersType)
  @FormGuard()
  async submissionAnswers(
    @Team() team: TeamModel,
    @Args('input') input: SubmissionAnswersInput
  ): Promise<SubmissionAnswersType> {
    const total = await this.submissionService.countAllWithFieldId(
      input.formId,
      input.fieldId
    )
    let answers: any[] = []

    if (total > 0) {
      answers = await this.submissionService.findAllWithFieldId(
        input.formId,
        input.fieldId,
        input.page,
        input.limit
      )

      // const contactIds: string[] = []
      // let contacts: ContactModel[] = []

      answers = answers.map(row => {
        // if (helper.isValid(row.contactId)) {
        //   contactIds.push(row.contactId)
        // }

        return {
          submissionId: row.id,
          contactId: row.contactId,
          kind: row.answers[0].kind,
          value: row.answers[0].value,
          endAt: row.endAt
        }
      })

      // if (helper.isValid(contactIds)) {
      //   contacts = await this.contactService.findByIdsInTeam(
      //     team.id,
      //     contactIds
      //   )
      // }
      //
      // if (helper.isValid(contacts)) {
      //   answers = answers.map(row => {
      //     row.contact = contacts.find(c => c.id === row.contactId)
      //     return row
      //   })
      // }
    }

    return {
      total,
      answers
    }
  }
}
