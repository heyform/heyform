import { helper } from '@heyform-inc/utils'
import { IconX } from '@tabler/icons-react'
import { useForm as useRCForm } from 'rc-field-form'
import { useTranslation } from 'react-i18next'

import { Button, Form, Input, Modal, useToast } from '@/components'
import { WorkspaceService } from '@/services'
import { useModal } from '@/store'
import { useFormState, useParam } from '@/utils'

export default function InvitationModal() {
  const { t } = useTranslation()

  const toast = useToast()
  const { workspaceId } = useParam()
  const [rcForm] = useRCForm()

  const { isOpen, onOpenChange } = useModal('InvitationModal')
  const [loading, error, { setTrue, setFalse, setError }] = useFormState()

  async function handleFinish(values: any) {
    const emails = values.emails.filter((e: string) => helper.isEmail(e))

    if (helper.isEmpty(emails)) {
      return setError(new Error(t('login.email.required')))
    }

    setTrue()
    setError(undefined)

    try {
      await WorkspaceService.sendInvites(workspaceId, emails)

      rcForm.resetFields()
      onOpenChange(false)

      toast({
        title: t('members.invite.sentSuccess', { count: emails.length }),
        message: t('members.invite.sentSuccessMessage')
      })
    } catch (err: any) {
      setError(err)
    }

    setFalse()
  }

  return (
    <Modal.Simple
      open={isOpen}
      title={t('members.invite.headline')}
      description={t('members.invite.subHeadline')}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <Form
        form={rcForm}
        initialValues={{
          emails: ['']
        }}
        onFinish={handleFinish}
      >
        <Form.List name="emails">
          {(fields, { add, remove }) => (
            <>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.key + index} className="flex items-start gap-x-1">
                    <Form.Item
                      className="flex-1"
                      {...field}
                      rules={[
                        {
                          required: true,
                          message: t('login.email.required')
                        },
                        {
                          type: 'email',
                          message: t('login.email.invalid')
                        }
                      ]}
                    >
                      <Input placeholder="name@example.com" />
                    </Form.Item>

                    {fields.length > 1 && (
                      <Button.Link
                        className="text-secondary hover:text-primary"
                        iconOnly
                        onClick={() => remove(index)}
                      >
                        <IconX className="h-5 w-5" />
                      </Button.Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button.Link size="md" onClick={() => add('')}>
                  {t('members.invite.addMore')}
                </Button.Link>

                <Button type="submit" className="min-w-24 px-5" size="md" loading={loading}>
                  {t('components.send')}
                </Button>
              </div>
            </>
          )}
        </Form.List>

        {error && !loading && <div className="!mt-1 text-sm/6 text-error">{error.message}</div>}
      </Form>
    </Modal.Simple>
  )
}
