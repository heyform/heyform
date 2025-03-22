import { Auth, Team, TeamGuard } from '@decorator'
import { InvoiceStatusInput } from '@graphql'
import { InvoiceStatusEnum, TeamModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { InvoiceService } from '@service'

@Resolver()
@Auth()
export class InvoiceStatusResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(returns => Number)
  @TeamGuard()
  async invoiceStatus(
    @Team() team: TeamModel,
    @Args('input') input: InvoiceStatusInput
  ): Promise<InvoiceStatusEnum> {
    const result = await this.invoiceService.findByTeamId(
      team.id,
      input.invoiceId
    )
    return result.status
  }
}
