import { FC, useMemo } from 'react'

const INITIAL_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>body{margin:40px;}.container{max-width:1180px;margin-left:auto;margin-right:auto;}.mt-10{margin-top:40px;}.hf{background:rgba(15,23,42,0.05);border-radius:4px;}.hf-1{width:40%;height:40px;margin-bottom:20px;}.hf-2{width:100%;height:40px;margin-bottom:60px;}.hf-3{width:100%;height:120px;margin-top:60px;margin-bottom:40px;}.flex{display:flex;gap:40px;margin-top:40px;}.hf-4{flex:1 1 auto;height:400px;}.heyform__loading-container{display:none!important;}</style>
</head>
<body>
  <div class="container">
    <div class="hf hf-1"></div>
    <div class="hf hf-2"></div>

    <div class="mt-10">
      {form}
    </div>

    <div class="hf hf-3"></div>
    <div class="hf hf-2"></div>

    <div class="flex">
      <div class="hf hf-4"></div>
      <div class="hf hf-4"></div>
    </div>
  </div>
</body>
</html>
`

export const EmbedPreview: FC<{ code: string }> = ({ code }) => {
  const content = useMemo(() => INITIAL_CONTENT.replace('{form}', code), [code])

  return (
    <div className="form-embed-preview hidden flex-1 lg:block">
      <iframe className="h-full w-full border-0" srcDoc={content} />
    </div>
  )
}
