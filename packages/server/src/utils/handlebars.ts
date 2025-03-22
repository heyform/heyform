// eslint-disable-next-line import/namespace
import * as hbs from 'hbs'

const h = hbs as any

h.registerHelper('json', (v1: any) => JSON.stringify(v1))
h.registerHelper('eq', (v1: any, v2: any) => v1 === v2)
h.registerHelper('ne', (v1: any, v2: any) => v1 !== v2)

export default h
