import {
  FormField,
  FormKindEnum,
  FormModel,
  InteractiveModeEnum,
  ThemeSettings
} from '@heyform-inc/shared-types-enums'
import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import got from 'got'

export const TEMPLATE_DETAIL_BASE_URL = 'https://heyform.github.io/templates/form/'
export const TEMPLATE_SUMMARY_URL = 'https://heyform.github.io/templates/list_summary.json'
type CatalogKind = 'summary'
const CACHE_TTL = 5 * 60 * 1000

export interface CatalogTemplate {
  id: string
  name: string
  category: string
  slug?: string
  thumbnail?: string
  fields: FormField[]
  themeSettings?: ThemeSettings
  kind: FormKindEnum
  interactiveMode: InteractiveModeEnum
  published: boolean
  usedCount: number
  hiddenFields?: FormModel['hiddenFields']
  logics?: FormModel['logics']
  variables?: FormModel['variables']
  translations?: FormModel['translations']
}

type RemoteTemplate = Partial<CatalogTemplate> & { thumbnailUrl?: string }

@Injectable()
export class TemplateService {
  private cache: Partial<Record<CatalogKind, CatalogTemplate[]>> = {}
  private expiresAt: Partial<Record<CatalogKind, number>> = {}
  private pending: Partial<Record<CatalogKind, Promise<CatalogTemplate[]>>> = {}

  private details = new Map<string, { template: CatalogTemplate; expiresAt: number }>()
  private pendingDetails = new Map<string, Promise<CatalogTemplate | null>>()

  private async loadCatalog(kind: CatalogKind): Promise<CatalogTemplate[]> {
    if (this.cache[kind] && Date.now() < (this.expiresAt[kind] || 0)) return this.cache[kind]!
    if (this.pending[kind]) return this.pending[kind]!

    this.pending[kind] = this.fetchCatalog(kind)
    try {
      return await this.pending[kind]!
    } finally {
      delete this.pending[kind]
    }
  }

  private async fetchCatalog(kind: CatalogKind): Promise<CatalogTemplate[]> {
    try {
      const data = await got
        .get(TEMPLATE_SUMMARY_URL, {
          timeout: { request: 15000 },
          retry: { limit: 1 }
        })
        .json<RemoteTemplate[]>()

      if (
        !Array.isArray(data) ||
        data.some(
          row =>
            !row ||
            typeof row.id !== 'string' ||
            typeof row.name !== 'string' ||
            typeof row.category !== 'string'
        )
      ) {
        throw new Error('Invalid template catalog')
      }

      const catalog = data.map(row => this.normalize(row))
      this.cache[kind] = catalog
      this.expiresAt[kind] = Date.now() + CACHE_TTL
      return catalog
    } catch {
      // Preserve a successfully loaded catalog during a temporary upstream outage.
      if (this.cache[kind]) return this.cache[kind]!
      throw new ServiceUnavailableException(
        'Unable to load the template catalog. Please try again later.'
      )
    }
  }

  private normalize(row: RemoteTemplate): CatalogTemplate {
    return {
      id: row.id!,
      name: row.name!,
      category:
        row.category === 'Employee & Job'
          ? 'Employee/Job'
          : row.category === 'Covid-19'
            ? 'COVID-19'
            : row.category!,
      slug: row.slug,
      thumbnail: row.thumbnailUrl || row.thumbnail,
      fields: row.fields || [],
      themeSettings: row.themeSettings,
      kind: row.kind ?? FormKindEnum.SURVEY,
      interactiveMode: row.interactiveMode ?? InteractiveModeEnum.GENERAL,
      published: true,
      usedCount: 0,
      hiddenFields: row.hiddenFields || [],
      logics: row.logics || [],
      variables: row.variables || [],
      translations: row.translations || {}
    }
  }

  async findById(id: string): Promise<CatalogTemplate | null> {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null
    const cached = this.details.get(id)
    if (cached && Date.now() < cached.expiresAt) return cached.template
    const pending = this.pendingDetails.get(id)
    if (pending) return pending

    const request = this.fetchDetail(id)
    this.pendingDetails.set(id, request)
    try {
      return await request
    } finally {
      this.pendingDetails.delete(id)
    }
  }

  private async fetchDetail(id: string): Promise<CatalogTemplate | null> {
    try {
      const row = await got
        .get(`${TEMPLATE_DETAIL_BASE_URL}${id}.json`, {
          timeout: { request: 15000 },
          retry: { limit: 1 }
        })
        .json<RemoteTemplate>()
      if (
        !row ||
        row.id !== id ||
        typeof row.name !== 'string' ||
        typeof row.category !== 'string' ||
        !Array.isArray(row.fields)
      ) {
        throw new Error('Invalid template detail')
      }
      const template = this.normalize(row)
      this.details.set(id, { template, expiresAt: Date.now() + CACHE_TTL })
      return template
    } catch (error) {
      if ((error as { response?: { statusCode?: number } }).response?.statusCode === 404) {
        this.details.delete(id)
        return null
      }
      const cached = this.details.get(id)
      if (cached) return cached.template
      throw new ServiceUnavailableException('Unable to load the template. Please try again later.')
    }
  }

  async findPublishedById(id: string): Promise<CatalogTemplate | null> {
    return this.findById(id)
  }

  async findPublishedBySlug(slug: string): Promise<CatalogTemplate | null> {
    return this.findBySlug(slug)
  }

  async findBySlug(slug: string): Promise<CatalogTemplate | null> {
    const summary = (await this.loadCatalog('summary')).find(template => template.slug === slug)
    return summary ? this.findById(summary.id) : null
  }

  async findAll(keyword?: string, limit?: number): Promise<CatalogTemplate[]> {
    let templates = await this.loadCatalog('summary')
    if (keyword)
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(keyword.toLowerCase())
      )
    return limit && limit > 0 ? templates.slice(0, limit) : templates
  }
}
