import { useState } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { carbonApi } from '../../api/carbonApi'
import { Spinner, SectionHeader } from '../../components/ui'
import { downloadBlob, MONTHS } from '../../utils/helpers'

export default function MonthlyReport() {
  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const years = Array.from({ length: 4 }, (_, index) => currentDate.getFullYear() - index)

  const download = async () => {
    setLoading(true)
    try {
      const res = await carbonApi.downloadMonthlyReport(year, month)
      downloadBlob(res.data, `carbon_report_${year}_${month}.csv`)
      toast.success('Report downloaded!')
    } catch {
      toast.error('Could not generate report. Make sure you have entries for this period.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const res = await carbonApi.downloadMonthlyPdfReport(year, month)
      downloadBlob(res.data, `carbon_report_${year}_${month}.pdf`)
      toast.success('PDF report downloaded!')
    } catch {
      toast.error('Could not generate PDF report for this period.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl"
      >
        <h1 className="page-title">Monthly Report</h1>
        <p className="page-subtitle">Download your carbon emission data as CSV or PDF</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Premium Export Console</p>
      </motion.div>

      <div className="glass-card p-6 space-y-6">
        <SectionHeader title="Export Options" subtitle="Select the period for your report" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field appearance-none cursor-pointer"
            >
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field appearance-none cursor-pointer"
            >
              {MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-surface-700/40 rounded-xl p-4 border border-surface-500/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-900/40 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {MONTHS[month - 1]} {year} Report
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              The CSV is useful for spreadsheet analysis. The PDF is a formatted monthly summary
              suitable for sharing or project documentation.
            </p>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} onClick={download} disabled={loading} className="btn-primary w-full">
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <><Download className="w-4 h-4" /> Download CSV Report</>
          )}
        </motion.button>

        <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} onClick={downloadPdf} disabled={pdfLoading} className="btn-secondary w-full">
          {pdfLoading ? (
            <Spinner size="sm" />
          ) : (
            <><Download className="w-4 h-4" /> Download PDF Report</>
          )}
        </motion.button>

        <div className="border-t border-surface-500/20 pt-4">
          <p className="text-xs text-slate-500">
            <span className="text-slate-400 font-medium">File formats:</span> CSV for spreadsheets and PDF for formatted monthly reporting
          </p>
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="Quick Select" subtitle="Click a month to select it" />
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {MONTHS.map((label, index) => (
            <button
              key={label}
              onClick={() => setMonth(index + 1)}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                month === index + 1
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700/40 text-slate-400 hover:bg-surface-600 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
