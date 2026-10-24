import { Auth, FormGuard } from '@decorator'
import { IntegrationInput, IntegrationRecordType } from '@graphql'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { IntegrationService } from '@service'

// Enough to see what happened to the latest submissions
export const INTEGRATION_RECORDS_LIMIT = 20

@Resolver()
@Auth()
export class IntegrationRecordsResolver {
  constructor(private readonly integrationService: IntegrationService) {}

  @Query(returns => [IntegrationRecordType])
  @FormGuard()
  async integrationRecords(
    @Args('input') input: IntegrationInput
  ): Promise<IntegrationRecordType[]> {
    const records = await this.integrationService.findRecords(
      input.formId,
      input.appId,
      INTEGRATION_RECORDS_LIMIT
    )

    return records.map(record => ({
      id: record.id,
      submissionId: record.submissionId,
      status: record.status,
      attempt: record.attempt,
      maxAttempts: record.maxAttempts,
      willRetry: !!record.willRetry,
      error: record.error,
      createdAt: Math.floor(new Date(record.createdAt!).getTime() / 1000)
    }))
  }
}
