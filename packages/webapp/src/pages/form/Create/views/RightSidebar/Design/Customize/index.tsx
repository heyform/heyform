import { helper } from '@heyform-inc/utils'
import { IconHelp } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  Form,
  Input,
  Select,
  Tooltip,
  notification,
  stopPropagation,
  useForm
} from '@/components/ui'
import { GOOGLE_FONTS_OPTIONS } from '@/consts'
import CustomCssHelpModal from '@/pages/form/Create/views/RightSidebar/Design/Customize/CustomCssHelpModal'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import { BackgroundBrightness } from './BackgroundBrightness'
import { BackgroundImage } from './BackgroundImage'
import { ColorPickerField } from './ColorPickerField'

export const Customize: FC = observer(() => {
  const { formId } = useParam()
  const formStore = useStore('formStore')
  const [form] = useForm()
  const [loading, setLoading] = useState(false)
  const [modalVisible, openModal, closeModal] = useVisible()
	const { t } = useTranslation()

  function handleValuesChange(changedValues: any) {
    formStore.updateCustomTheme(changedValues)
  }

  async function handleFinish(theme: any) {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      await FormService.updateTheme(formId, {
        theme
      })

      notification.success({
        title: 'Theme settings updated'
      })
    } catch (err: any) {
      notification.error({
        title: err.message
      })
    }

    setLoading(false)
  }

  function handleRevert(event: any) {
    stopPropagation(event)
    formStore.resetCustomTheme()

    // Reset form theme
    setTimeout(() => {
      form.setFieldsValue(formStore.theme)
      form.resetFields()
    }, 0)
  }

  return (
    <div>
      <Form
        form={form}
        initialValues={formStore.customTheme}
        onValuesChange={handleValuesChange}
        onFinish={handleFinish}
      >
        <div className="customize-list scrollbar">
          <div className="right-sidebar-group">
            <Form.Item name="fontFamily">
              <Select options={GOOGLE_FONTS_OPTIONS} />
            </Form.Item>

            <Form.Item name="questionTextColor">
              <ColorPickerField label={t('Questions')} />
            </Form.Item>

            <Form.Item name="answerTextColor">
              <ColorPickerField label={t('Answers')} />
            </Form.Item>

            <Form.Item name="buttonBackground">
              <ColorPickerField label={t('Buttons')} />
            </Form.Item>

            <Form.Item name="buttonTextColor">
              <ColorPickerField label={t('ButtonText')} />
            </Form.Item>

            <Form.Item name="backgroundColor">
              <ColorPickerField label={t('Background')} />
            </Form.Item>
          </div>

          <div className="right-sidebar-group">
            <Form.Item name="backgroundImage">
              <BackgroundImage />
            </Form.Item>
          </div>

          {helper.isURL(formStore.customTheme?.backgroundImage) && (
            <div className="right-sidebar-group">
              <Form.Item name="backgroundBrightness">
                <BackgroundBrightness backgroundImage={formStore.customTheme?.backgroundImage} />
              </Form.Item>
            </div>
          )}

          <div className="right-sidebar-group">
            <Form.Item
              name="customCSS"
              label={
                <div className="flex items-center">
                  <span>{t('formBuilder.customCSS')}</span>
                  <Tooltip ariaLabel="Learn more about custom css">
                    <Button.Link
                      className="custom-css-help"
                      leading={<IconHelp />}
                      onClick={openModal}
                    />
                  </Tooltip>
                </div>
              }
            >
              <Input.Textarea className="mt-2" rows={12} />
            </Form.Item>
          </div>
        </div>

        <Form.Item className="customize-bottom">
          <div className="flex items-center">
            <Button onClick={handleRevert}>{t('Revert')}</Button>
            <Button className="ml-4 flex-1" type="primary" htmlType="submit" loading={loading}>
              {t('formBuilder.saveChanges')}
            </Button>
          </div>
        </Form.Item>
      </Form>

      <CustomCssHelpModal visible={modalVisible} onClose={closeModal} />
    </div>
  )
})
