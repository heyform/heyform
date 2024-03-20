import { Injectable } from '@nestjs/common'
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql'
import { UserInputError } from 'apollo-server-express'
import { ValidationError } from 'class-validator'

import { helper } from '@heyform-inc/utils'

import { LowerCaseDirective } from '@utils'

@Injectable()
export class GraphqlService implements GqlOptionsFactory {
  async createGqlOptions(): Promise<GqlModuleOptions> {
    return {
      schemaDirectives: {
        lower: LowerCaseDirective
      },
      resolverValidationOptions: {
        requireResolversForResolveType: false
      },
      autoSchemaFile: true,
      bodyParserConfig: { limit: '10mb' },
      introspection: true,
      playground: false,
      formatError: e => {
        if (e instanceof ValidationError || e instanceof UserInputError) {
          return {
            code: e.extensions.code,
            message: e.message
          }
        }

        const response = e.extensions.exception?.response
        let code = e.extensions.code
        let message = e.message as string

        if (helper.isValid(response)) {
          if (helper.isValid(response.code)) {
            code = response.code
          } else if (helper.isValid(response.error)) {
            code = response.error.replace(/\s+/g, '_').toUpperCase()
          }

          if (helper.isValid(response.message)) {
            message = helper.isArray(response.message) ? response.message[0] : response.message
          }
        }

        delete e.extensions.exception.response

        return {
          code,
          message: e.message,
          ...e.extensions.exception,
          ...{ message }
        }
      },
      formatResponse: response => {
        return response
      },
      context: ({ req, res }) => ({ req, res }),
      cors: {
        credentials: true,
        origin: true
      },
      uploads: false
    }
  }
}
