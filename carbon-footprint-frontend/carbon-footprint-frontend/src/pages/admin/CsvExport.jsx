import { useState } from 'react'
import { Download, FileText, Calendar, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { carbonApi } from '../../api/carbonApi'
import { Spinner, SectionHeader } from '../../components/ui'
import { downloadBlob, MONTHS } from '../../utils/helpers'

export default function CsvExport() {
  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const years = Array.from({ length: 4 }, (_, i) => currentDate.getFullYear() - i)

  const handleExport = async () => {
    setLoading(true)
    const entry = { year, month, status: 'loading', ts: new Date().toLocaleTimeString() }
    setHistory((h) => [entry, ...h.slice(0, 9)])
    try {
      const res = await carbonApi.downloadAdminMonthlyReport(year, month)
      downloadBlob(res.data, `admin_carbon_report_${year}_${String(month).padStart(2,'0')}.csv`)
      toast.success('Report exported successfully')
      setHistory((h) => h.map((e, i) => i === 0 ? { ...e, status: 'success' } : e))
    } catch (err) {
      toast.error('Export failed. No data may exist for this period.')
      setHistory((h) => h.map((e, i) => i === 0 ? { ...e, status: 'error' } : e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header rounded-3xl border border-indigo-300/20 bg-slate-900/55 p-5 backdrop-blur-xl"
      >
        <h1 className="page-title">CSV Export</h1>
        <p className="page-subtitle">Export system-wide carbon emission data for reporting</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Enterprise Reporting Matrix</p>
      </motion.div>

      {/* Export config */}
      <div className="glass-card p-6 space-y-5">
        <SectionHeader title="Export Configuration" subtitle="Select period and generate report" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field appearance-none cursor-pointer"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field appearance-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 bg-surface-700/40 rounded-xl p-4 border border-surface-500/20">
          <FileText className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">
              Admin Export — {MONTHS[month - 1]} {year}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This export includes <strong className="text-slate-300">all users'</strong> carbon entries for
              the selected month. Columns: User ID, Name, Email, Zone, Activity Type, Quantity,
              Unit, CO₂ Amount (kg), Entry Date.
            </p>
          </div>
        </div>

        {/* Month quick-select */}
        <div>
          <label className="label">Quick select month</label>
          <div className="grid grid-cols-6 gap-1.5">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setMonth(i + 1)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  month === i + 1
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-700/40 text-slate-400 hover:bg-surface-600 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleExport}
          disabled={loading}
          className="btn-primary w-full text-base py-3"
        >
          {loading ? (
            <><Spinner size="sm" /> Generating report…</>
          ) : (
            <><Download className="w-5 h-5" /> Export CSV — {MONTHS[month - 1]} {year}</>
          )}
        </motion.button>
      </div>

      {/* Export history */}
      {history.length > 0 && (
        <div className="glass-card p-5">
          <SectionHeader title="Recent Exports" subtitle="Session export history" />
          <div className="space-y-2">
            {history.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface-700/30 border border-surface-500/20"
              >
                <div className="flex items-center gap-3">
                  {entry.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-brand-400" />
                  ) : entry.status === 'error' ? (
                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-xs">✕</span>
                    </div>
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500 animate-pulse" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {MONTHS[entry.month - 1]} {entry.year}
                    </p>
                    <p className="text-[11px] text-slate-500">{entry.ts}</p>
                  </div>
                </div>
                <span className={`badge text-[11px] ${
                  entry.status === 'success' ? 'badge-green' :
                  entry.status === 'error' ? 'badge-red' : 'badge-slate'
                }`}>
                  {entry.status === 'success' ? 'Downloaded' :
                   entry.status === 'error' ? 'Failed' : 'Processing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format info */}
      <div className="glass-card p-5">
        <SectionHeader title="File Format Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Format', value: 'CSV (UTF-8, comma-delimited)' },
            { label: 'Compatible with', value: 'Excel, Google Sheets, Numbers, R, Python' },
            { label: 'Date format', value: 'ISO 8601 (YYYY-MM-DD)' },
            { label: 'Emission unit', value: 'Kilograms CO₂ equivalent' },
          ].map((item) => (
            <div key={item.label} className="bg-surface-700/30 rounded-lg p-3">
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm text-slate-300 font-medium mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
