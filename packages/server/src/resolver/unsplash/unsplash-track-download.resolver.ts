import { Args, Mutation, Resolver } from '@nestjs/graphql'

import { helper } from '@heyform-inc/utils'

import { Auth } from '@decorator'
import { UNSPLASH_CLIENT_ID } from '@environments'
import { UnsplashTrackDownloadInput } from '@graphql'
import { Unsplash } from '@utils'

@Resolver()
@Auth()
export class UnsplashTrackDownloadResolver {
  @Mutation(returns => Boolean)
  async unsplashTrackDownload(@Args('input') input: UnsplashTrackDownloadInput): Promise<boolean> {
    const unsplash = Unsplash.init({
      clientId: UNSPLASH_CLIENT_ID
    })
    return helper.isValid(await unsplash.trackDownload(input.downloadUrl))
  }
}
