import { Controller, Get, Query, Res } from '@nestjs/common'
import { ImageResizingDto } from '@dto'
import got from 'got'
import { Readable } from 'stream'
import { md5 } from '@heyforms/nestjs'
import { mime, qs } from '@heyform-inc/utils'
import { BUNNY_CACHE_DIR } from '@environments'
import { createReadStream, promises } from 'fs'
import { resolve } from 'path'
import * as sharp from 'sharp'

@Controller()
export class ImageController {
  @Get('/api/image')
  async index(@Query() input: ImageResizingDto, @Res() res: any) {
    const filePath = await this._getPath(input)
    const headersPath = `${filePath}.json`
    const isFileExists = await this._isFileExists(filePath)

    if (isFileExists) {
      const headers = JSON.parse(
        (await promises.readFile(headersPath)).toString()
      )

      // Override the content type if the format is provided
      if (input.format) {
        headers['Content-Type'] = mime(input.format)
      }

      res.set(headers)
      return createReadStream(filePath).pipe(res)
    }

    const result = await got(input.url, {
      responseType: 'buffer'
    })

    let fileBuffer = result.body
    const width = input.w ? Number(input.w) : undefined
    const height = input.h ? Number(input.h) : undefined

    if (width > 0 || height > 0) {
      fileBuffer = await sharp(result.body).resize({ width, height }).toBuffer()
    }

    const headers = {
      'Content-Type': mime(input.format || 'webp'),
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'public, max-age=315360000, must-revalidate'
    }

    await Promise.all([
      promises.writeFile(headersPath, JSON.stringify(headers), {
        encoding: 'utf8'
      }),
      promises.writeFile(filePath, fileBuffer)
    ])

    res.set(headers)
    this._getReadableStream(fileBuffer).pipe(res)
  }

  private async _isFileExists(filePath: string) {
    try {
      const result = await promises.stat(filePath)
      return result.isFile()
    } catch {
      return false
    }
  }

  private async _getPath(input: ImageResizingDto) {
    const hash = md5(qs.stringify(input))
    const dir = resolve(BUNNY_CACHE_DIR, hash.slice(0, 2), hash.slice(2, 4))

    await promises.mkdir(dir, {
      recursive: true
    })

    return resolve(dir, hash.slice(4))
  }

  private _getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable()

    stream.push(buffer)
    stream.push(null)

    return stream
  }
}
