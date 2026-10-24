import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import got from 'got'
import type { IncomingHttpHeaders } from 'http'
import { Readable } from 'stream'

import { MAX_REMOTE_IMAGE_BYTES, SafeImageResult, sanitizeRemoteImage } from '@config'
import { ALLOWED_IMAGE_HOSTS, FIRST_PARTY_IMAGE_ORIGINS, ImageResizingDto } from '@dto'
import { Logger, SafeOutboundRequest, assertSafeOutboundRequest } from '@utils'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

async function fetchRemoteImage(
  url: URL,
  lookup: SafeOutboundRequest['lookup']
): Promise<{ body: Buffer; headers: IncomingHttpHeaders }> {
  const request = got.stream(url, {
    followRedirect: false,
    lookup,
    retry: {
      limit: 0
    },
    timeout: {
      request: 10_000
    }
  })
  const chunks: Buffer[] = []
  let headers: IncomingHttpHeaders = {}
  let size = 0

  request.once('response', response => {
    headers = response.headers
  })

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length

    if (size > MAX_REMOTE_IMAGE_BYTES) {
      request.destroy()
      throw new Error('Image response is too large')
    }

    chunks.push(buffer)
  }

  return {
    body: Buffer.concat(chunks, size),
    headers
  }
}

@Controller()
export class ImageController {
  private readonly logger = new Logger(ImageController.name)

  @Get('/api/image')
  async index(@Query() input: ImageResizingDto, @Res() res: Response) {
    const { lookup, url } = await assertSafeOutboundRequest(input.url, {
      allowedHosts: ALLOWED_IMAGE_HOSTS,
      allowedPrivateOrigins: FIRST_PARTY_IMAGE_ORIGINS
    })

    let result: { body: Buffer; headers: IncomingHttpHeaders }

    try {
      result = await fetchRemoteImage(url, lookup)
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to fetch image from "${input.url}": ${getErrorMessage(error, 'Unknown got error')}`
      )

      return this._sendEmptyImageResponse(res)
    }

    const contentTypeHeader = result.headers['content-type']
    const contentType = (
      Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader
    )
      ?.split(';', 1)[0]
      .trim()
      .toLowerCase()

    if (
      !contentType ||
      !['image/gif', 'image/jpeg', 'image/png', 'image/webp'].includes(contentType)
    ) {
      this.logger.warn(
        `Image URL "${input.url}" returned unsupported content type "${contentType}"`
      )

      return this._sendEmptyImageResponse(res)
    }

    let safeImage: SafeImageResult

    try {
      safeImage = await sanitizeRemoteImage(
        result.body,
        input.w === undefined ? undefined : Number(input.w),
        input.h === undefined ? undefined : Number(input.h)
      )
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to safely process image from "${input.url}": ${getErrorMessage(
          error,
          'Unknown sharp error'
        )}`
      )

      return this._sendEmptyImageResponse(res)
    }

    res.set({
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Disposition': `inline; filename="image.${safeImage.extension}"`,
      'Content-Length': safeImage.buffer.length,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': safeImage.contentType,
      'X-Content-Type-Options': 'nosniff'
    })
    this._getReadableStream(safeImage.buffer).pipe(res)
  }

  private _getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable()

    stream.push(buffer)
    stream.push(null)

    return stream
  }

  private _sendEmptyImageResponse(res: Response) {
    res.status(204)
    res.set({
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff'
    })

    return res.end()
  }
}
