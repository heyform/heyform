// @ts-ignore
import * as hbs from 'hbs'

const h = hbs as any

h.registerHelper('json', v1 => JSON.stringify(v1))
h.registerHelper('eq', (v1, v2) => v1 === v2)
h.registerHelper('ne', (v1, v2) => v1 !== v2)

export default h
