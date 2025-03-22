import { LowerCaseDirective } from '@heyforms/nestjs'
import { bytes, helper } from '@heyform-inc/utils'
import { Injectable } from '@nestjs/common'
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql'
import { UserInputError } from 'apollo-server-express'
import { ValidationError } from 'class-validator'

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

          // 自定义的数据校验错误信息
          if (helper.isValid(response.message)) {
            message = helper.isArray(response.message)
              ? response.message[0]
              : response.message
          }
        }

        // 删除重复错误信息
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
      uploads: {
        maxFieldSize: bytes('1mb'),
        maxFileSize: bytes('10mb'),
        /**
         * Graphql-upload count form fields as file,
         * so we can't set this options to 1
         *
         * Example:
         * Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
         *
         * ----WebKitFormBoundary7MA4YWxkTrZu0gW
         * Content-Disposition: form-data; name="operations"
         *
         * {"query":"mutation uploadFile(...)","variables":{"input":{"file":null}}}
         * ----WebKitFormBoundary7MA4YWxkTrZu0gW
         * Content-Disposition: form-data; name="map"
         *
         * {"file": ["variables.input.file"]}
         * ----WebKitFormBoundary7MA4YWxkTrZu0gW
         * Content-Type: image/jpeg
         *
         * (data)
         * ----WebKitFormBoundary7MA4YWxkTrZu0gW
         */
        maxFiles: 3
      }
    }
  }
}
