import { DATA_MASK_OPTIONS } from '@decorator'
import { helper } from '@heyform-inc/utils'
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor
} from '@nestjs/common'
import { ClassTransformOptions, plainToClass } from 'class-transformer'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators' // NOTE (external)

// NOTE (external)
// We need to deduplicate them here due to the circular dependency
// between core and common packages
const REFLECTOR = 'Reflector'

export type TypeFunc = (returns?: void) => any
type PlainObject = Record<string, any>

export interface ResponseDataMaskOptions extends ClassTransformOptions {
  typeFunc: TypeFunc
}

const DEFAULT_OPTIONS = {
  excludeExtraneousValues: true
}

@Injectable()
export class DataMaskInterceptor implements NestInterceptor {
  constructor(@Inject(REFLECTOR) protected readonly reflector: any) {}

  private static maskingData(
    response: PlainObject | Array<PlainObject>,
    options: ResponseDataMaskOptions
  ): PlainObject | PlainObject[] {
    const types = options.typeFunc()
    const returnType = helper.isArray(types) ? types[0] : types
    return plainToClass(returnType, response, options)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextOptions = this.getContextOptions(context)
    const options = {
      ...DEFAULT_OPTIONS,
      ...contextOptions
    }

    return next
      .handle()
      .pipe(
        map((res: PlainObject | Array<PlainObject>) =>
          DataMaskInterceptor.maskingData(res, options)
        )
      )
  }

  private getContextOptions(
    context: ExecutionContext
  ): ResponseDataMaskOptions | undefined {
    return (
      this.reflectSerializeMetadata(context.getHandler()) ||
      this.reflectSerializeMetadata(context.getClass())
    )
  }

  private reflectSerializeMetadata(
    obj: object | Function
  ): ResponseDataMaskOptions | undefined {
    return this.reflector.get(DATA_MASK_OPTIONS, obj)
  }
}
