import { Logger as L } from '@nestjs/common'

export class Logger extends L {
  static info(message: any, context?: string): void {
    L.log(message, context)
  }

  static trace(message: any, trace?: string, context?: string): void {
    L.error(message, trace, context)
  }

  static fatal(message: any, trace?: string, context?: string): void {
    L.error(message, trace, context)
  }

  info(message: any, context?: string): void {
    this.log(message, context)
  }

  trace(message: any, trace?: string, context?: string): void {
    this.error(message, trace, context)
  }

  fatal(message: any, trace?: string, context?: string): void {
    this.error(message, trace, context)
  }
}
