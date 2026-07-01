import { useEffect, useRef } from 'react'

import { Form, Input, Select } from '@/components'
import { useFormStore } from '@/store'

export default function FormSettingsStorage() {
  const { tempSettings } = useFormStore()

  // Capture the provider that was saved in the DB — only once on first mount
  const originalProviderRef = useRef<string>('vps')
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current && tempSettings?.storageProvider) {
      originalProviderRef.current = tempSettings.storageProvider
      hasInitialized.current = true
    }
  }, [tempSettings])

  return (
    <section id="storage" className="pt-10">
      <h2 className="hf-section-title">Storage & Uploads</h2>

      <div className="mt-4 space-y-8">
        <div>
          <Form.Item
            className="[&_[data-slot=content]]:pt-1.5"
            name="storageProvider"
            label="Storage provider"
            description="Choose where form uploads are stored"
            isInline
          >
            {(control: any) => (
              <div className="flex flex-col gap-1.5 sm:w-64">
                <Select
                  className="w-full"
                  value={control.value}
                  onChange={control.onChange}
                  options={[
                    { label: 'VPS Storage (Default)', value: 'vps' },
                    { label: 'AWS S3', value: 's3' }
                  ]}
                  contentProps={{
                    position: 'popper'
                  }}
                />
                <span className="text-secondary text-xs">
                  S3 recommended for large photo forms
                </span>
              </div>
            )}
          </Form.Item>

          {/* Warning banner: shown only when the saved provider was s3 and user switches back to vps */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.storageProvider !== currentValues.storageProvider
            }
          >
            {(_props: any, _meta: any, form: any) => {
              const currentProvider = form?.getFieldValue('storageProvider')
              if (originalProviderRef.current === 's3' && currentProvider === 'vps') {
                return (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-400">
                    ⚠ Switching back to VPS will not migrate existing S3 uploads. New uploads will use local storage.
                  </div>
                )
              }
              return null
            }}
          </Form.Item>
        </div>

        <Form.Item
          className="[&_[data-slot=content]]:pt-1.5"
          name="maxUploadSizeMb"
          label="Max upload size per file"
          description="Maximum size allowed per uploaded file (1–50 MB)"
          isInline
          rules={[
            {
              type: 'number',
              required: true,
              min: 1,
              max: 50,
              message: 'Please enter a value between 1 and 50'
            }
          ]}
        >
          <Input type="number" min={1} max={50} className="w-full sm:w-32" trailing="MB" />
        </Form.Item>
      </div>
    </section>
  )
}
