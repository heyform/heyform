import { CrownIcon, EmotionIcon, LikeIcon, StarIcon, ThumbsUpIcon } from '@/components'

export const RATING_TOTAL_OPTIONS: IOptionType[] = Array.from({ length: 10 }, (_, index) => ({
  value: index + 1,
  label: index + 1
}))

export const RATING_SHAPE_OPTIONS: IOptionType[] = [
  {
    value: 'star',
    label: 'formBuilder.star'
  },
  {
    value: 'heart',
    label: 'formBuilder.like'
  },
  {
    value: 'thumb_up',
    label: 'formBuilder.thumbsUp'
  },
  {
    value: 'crown',
    label: 'formBuilder.crown'
  },
  {
    value: 'happy',
    label: 'formBuilder.happy'
  }
]

export const RATING_SHAPE_CONFIG: IMapType = {
  heart: <LikeIcon />,
  thumb_up: <ThumbsUpIcon />,
  happy: <EmotionIcon />,
  crown: <CrownIcon />,
  star: <StarIcon />
}

export const OPINION_SCALE_OPTIONS: IOptionType[] = Array.from({ length: 6 }, (_, index) => ({
  value: index + 5,
  label: index + 5
}))
