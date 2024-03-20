import { IconSearch } from '@tabler/icons-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Async } from '@/components'
import { Input } from '@/components/ui'
import { UnsplashService } from '@/service'

interface UnsplashProps {
  onChange: (src: string) => void
}

interface ImageItemProps {
  image: any
  onChange: (src: string) => void
}

const ImageItem: FC<ImageItemProps> = ({ image, onChange }) => {
  function handleClick() {
    onChange(image.url)
    UnsplashService.trackDownload(image.downloadUrl)
  }

  return (
    <li className="w-1/2 pb-4 pl-2 pr-2 sm:w-1/3 lg:w-1/4" onClick={handleClick}>
      <div className="focus-within:ring-offset-white-100 group relative block h-20 cursor-pointer overflow-hidden rounded-md bg-slate-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
        <img
          className="pointer-events-none h-full w-full object-cover group-hover:opacity-75"
          src={image.thumbUrl}
          alt=""
        />
        <a
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-800 px-2 py-1.5 text-xs text-white underline opacity-0 transition-opacity duration-100 ease-in-out group-hover:opacity-100"
          href={image.authorUrl}
          target="_blank"
        >
          {image.author}
        </a>
      </div>
    </li>
  )
}

const Skeleton: FC = () => {
  return (
    <ul className="-ml-2 -mr-2 flex flex-wrap">
      {Array.from({ length: 12 }).map((_, index) => (
        <li key={index} className="w-1/2 pb-4 pl-2 pr-2 sm:w-1/3 lg:w-1/4">
          <div className="skeleton block h-20 rounded-md" />
        </li>
      ))}
    </ul>
  )
}

export const Unsplash: FC<UnsplashProps> = ({ onChange }) => {
  const [keyword, setKeyword] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<any[]>([])
  const { t } = useTranslation()

  async function getImages() {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      const result = await UnsplashService.search(keyword as string)
      setImages(result)
    } catch (_) {}

    setLoading(false)
    return images.length > 0
  }

  function handleKeyDown(event: any) {
    if (event.key === 'Enter') {
      setKeyword(event.target.value)
    }
  }

  return (
    <div>
      <Input placeholder={t('other.Search')} leading={<IconSearch />} onKeyDown={handleKeyDown} />
      <Async className="mt-4" request={getImages} deps={[keyword]} skeleton={<Skeleton />}>
        <ul role="list" className="-ml-2 -mr-2 flex flex-wrap">
          {images.map(row => (
            <ImageItem key={row.id} image={row} onChange={onChange} />
          ))}
        </ul>
      </Async>
    </div>
  )
}
