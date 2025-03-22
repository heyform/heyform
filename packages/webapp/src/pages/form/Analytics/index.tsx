import CustomReportModal from './CustomReportModal'
import FormAnalyticsOverview from './Overview'
import FormAnalyticsReport from './Report'

export default function FormAnalytics() {
  return (
    <>
      <FormAnalyticsOverview />
      <FormAnalyticsReport />
      <CustomReportModal />
    </>
  )
}
