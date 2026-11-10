import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Without this plugin dayjs ignores the format and falls back to Date.parse, so a `DD/MM/YYYY`
// answer would be read as a US date. Every module that parses with a format imports dayjs from
// here, so the plugin is registered by the module that needs it instead of by a side effect of
// whichever file happens to be imported first.
dayjs.extend(customParseFormat)

export type { Dayjs } from 'dayjs'

export default dayjs
