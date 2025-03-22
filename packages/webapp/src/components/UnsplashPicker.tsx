import { UnsplashImage } from '@heyform-inc/shared-types-enums'
import { IconSearch } from '@tabler/icons-react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { UnsplashService } from '@/services'

import { Async } from './Async'
import { EmptyState } from './EmptyState'
import { Input } from './Input'
import { Repeat } from './Repeat'

interface UnsplashPickerProps extends Omit<ComponentProps, 'onChange'> {
  onChange?: (value: string) => void
}

interface UnsplashItemProps extends UnsplashPickerProps {
  image: UnsplashImage
}

const Skeleton = () => {
  return (
    <ul className="-ml-2 -mr-2 mt-4 flex flex-wrap">
      <Repeat count={16}>
        <li className="w-1/2 pb-4 pl-2 pr-2 sm:w-1/3 lg:w-1/4">
          <div className="skeleton block h-20 rounded-md" />
        </li>
      </Repeat>
    </ul>
  )
}

const UnsplashItem: FC<UnsplashItemProps> = ({ image, onChange }) => {
  function handleClick() {
    UnsplashService.trackDownload(image.downloadUrl)
    onChange?.(image.url)
  }

  return (
    <li className="w-1/2 pb-4 pl-2 pr-2 sm:w-1/3 lg:w-1/4" onClick={handleClick}>
      <div className="focus-within:ring-offset-foreground-100 group relative block h-20 cursor-pointer overflow-hidden rounded-md bg-slate-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
        <img
          className="pointer-events-none h-full w-full object-cover group-hover:opacity-75"
          src={image.thumbUrl}
          alt=""
        />
        <a
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-800 px-2 py-1.5 text-xs text-foreground underline opacity-0 transition-opacity duration-100 ease-in-out group-hover:opacity-100"
          href={image.authorUrl}
          target="_blank"
          rel="noreferrer"
        >
          {image.author}
        </a>
      </div>
    </li>
  )
}

export const UnsplashPicker: FC<UnsplashPickerProps> = ({ onChange, ...restProps }) => {
  const { t } = useTranslation()

  const [keyword, setKeyword] = useState<string>()
  const [images, setImages] = useState<UnsplashImage[]>([])

  async function fetch() {
    const result = await UnsplashService.search(keyword as string)
    setImages(result)

    return result.length > 0
  }

  return (
    <div {...restProps}>
      <Input
        className="[&_[data-slot=input]]:pl-10"
        placeholder={t('components.imagePicker.unsplash.search')}
        leading={<IconSearch className="h-5 w-5 text-secondary" />}
        onEnter={setKeyword}
      />
      <Async
        fetch={fetch}
        refreshDeps={[keyword]}
        loader={<Skeleton />}
        emptyRender={({ refresh }) => (
          <EmptyState
            className="flex h-full flex-col items-center justify-center"
            headline={t('components.imagePicker.unsplash.emptyState')}
            buttonTitle={t('components.refresh')}
            onClick={refresh}
          />
        )}
      >
        <ul role="list" className="-ml-2 -mr-2 mt-4 flex flex-wrap">
          {images.map(row => (
            <UnsplashItem key={row.id} image={row} onChange={onChange} />
          ))}
        </ul>
      </Async>
    </div>
  )
}
