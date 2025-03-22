import { Auth, TeamGuard } from '@decorator'
import { InvoiceType, TeamDetailInput } from '@graphql'
import { InvoiceModel } from '@model'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { InvoiceService } from '@service'

@Resolver()
@Auth()
export class InvoicesResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query(returns => [InvoiceType])
  @TeamGuard()
  async invoices(
    @Args('input') input: TeamDetailInput
  ): Promise<InvoiceModel[]> {
    return this.invoiceService.findAllPaidInTeam(input.teamId)
  }
}
