import * as m from 'mime-types'

export const commonImageMimeTypes: string[] = [
  m.lookup('.jpg'),
  m.lookup('.png'),
  m.lookup('.bmp'),
  m.lookup('.gif')
] as any

export const commonFileMimeTypes: string[] = [
  ...commonImageMimeTypes,
  m.lookup('.txt'),
  m.lookup('.md'),
  m.lookup('.doc'),
  m.lookup('.docx'),
  m.lookup('.xls'),
  m.lookup('.xlsx'),
  m.lookup('.csv'),
  m.lookup('.ppt'),
  m.lookup('.pptx'),
  m.lookup('.pdf'),
  m.lookup('.mp4'),
  m.lookup('.wmv')
] as any

export const mime = m.lookup
