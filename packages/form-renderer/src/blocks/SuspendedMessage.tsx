import { useTranslation } from '../utils'
import { ThankYou } from './ThankYou'

export const SuspendedMessage = () => {
  const { t } = useTranslation()

  const field: any = {
    title: t("This page doesn't exist"),
    description: t('If you have any questions, please contact us.')
  }

  return <ThankYou field={field} />
}
