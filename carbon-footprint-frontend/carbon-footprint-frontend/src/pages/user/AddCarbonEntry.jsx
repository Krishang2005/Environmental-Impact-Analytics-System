import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Zap, BookmarkPlus, Trash2, Clock } from 'lucide-react'
import { carbonApi } from '../../api/carbonApi'
import { useFetch } from '../../hooks/useFetch'
import { Spinner, SectionHeader, Modal } from '../../components/ui'
import {
  ACTIVITY_TYPES, getActivityLabel, getActivityUnit, getErrorMessage,
  formatCarbonShort,
} from '../../utils/helpers'

const ELECTRICITY_USAGE_MODES = {
  LIGHT: {
    label: 'Light',
    kwhPerHour: 0.45,
    description: 'Lights, fans, laptop use, routers, and normal device charging.',
  },
  NORMAL: {
    label: 'Normal',
    kwhPerHour: 0.8,
    description: 'Typical mixed household usage with regular appliances running.',
  },
  HEAVY: {
    label: 'Heavy',
    kwhPerHour: 1.35,
    description: 'High appliance load with multiple devices or power-hungry equipment.',
  },
}

const ACTIVITY_EXPLAINERS = {
  ELECTRICITY: {
    why: 'Emissions come from the power plants and grid sources used to generate the electricity you consume.',
    use: 'Use this for home or office power usage such as lights, fans, appliances, and device charging. Enter hours of use, choose a usage level, and the app will estimate kWh automatically.',
    tip: 'Light, Normal, and Heavy presets make the estimate more realistic when you do not have an exact meter reading.',
  },
  CAR: {
    why: 'Car travel releases carbon mainly from burning fuel while the vehicle is moving.',
    use: 'Use this for personal car trips and enter the travel distance.',
    tip: 'Longer trips, traffic, and frequent solo driving usually increase emissions.',
  },
  BIKE: {
    why: 'Bike or scooter travel creates emissions from the fuel or energy used during travel.',
    use: 'Use this for scooter or motorbike distance covered.',
    tip: 'It is usually lower than car travel, but it still rises with more kilometres.',
  },
  AC: {
    why: 'Air conditioning adds emissions because it consumes electricity while cooling the space.',
    use: 'Use this for AC runtime and enter the number of hours used.',
    tip: 'Longer cooling hours and lower temperature settings usually push emissions up faster.',
  },
  WASTE: {
    why: 'Waste creates emissions during collection, transport, landfill decomposition, or burning.',
    use: 'Use this for the amount of waste generated or disposed.',
    tip: 'Mixed waste usually has a higher impact than reducing, reusing, or segregating it.',
  },
  DIESEL: {
    why: 'Diesel directly releases carbon dioxide when it is burned as fuel.',
    use: 'Use this for diesel consumed in vehicles, generators, or machinery.',
    tip: 'Every extra litre adds directly to the total carbon footprint.',
  },
  PETROL: {
    why: 'Petrol releases carbon emissions through direct fuel combustion.',
    use: 'Use this for petrol used in vehicles or equipment.',
    tip: 'Frequent trips and inefficient driving make this category rise quickly.',
  },
  NATURAL_GAS: {
    why: 'Natural gas produces emissions when it is burned for cooking, heating, or industrial use.',
    use: 'Use this for piped gas or similar gas consumption.',
    tip: 'More gas use means more combustion and more carbon released.',
  },
  FLIGHT: {
    why: 'Flights create emissions from jet fuel burned over long distances.',
    use: 'Use this for air travel and enter the trip distance.',
    tip: 'Flights usually have one of the highest impacts per trip, especially for longer journeys.',
  },
  PUBLIC_TRANSPORT: {
    why: 'Public transport still emits carbon because buses, trains, or shared vehicles use fuel or electricity.',
    use: 'Use this for shared travel distance such as bus, metro, or train trips.',
    tip: 'It is usually better than driving alone because the impact is shared across passengers.',
  },
  OTHER: {
    why: 'This covers emission sources that do not neatly fit into the main categories.',
    use: 'Use this for custom or miscellaneous activities you still want to track.',
    tip: 'Choose a quantity that stays consistent so you can compare your pattern over time.',
  },
}

const schema = z.object({
  activityType: z.string().min(1, 'Select an activity'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  electricityMode: z.string().default('NORMAL'),
})

function roundToTwo(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function getEffectiveQuantity(activityType, quantity, electricityMode = 'NORMAL') {
  const numericQuantity = Number(quantity || 0)
  if (!numericQuantity) return 0

  if (activityType === 'ELECTRICITY') {
    const selectedMode = ELECTRICITY_USAGE_MODES[electricityMode] || ELECTRICITY_USAGE_MODES.NORMAL
    return roundToTwo(numericQuantity * selectedMode.kwhPerHour)
  }

  return numericQuantity
}

export default function AddCarbonEntry() {
  const [loading, setLoading] = useState(false)
  const [lastAdded, setLastAdded] = useState(null)
  const [saveTemplate, setSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showSimulate, setShowSimulate] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)

  const { data: templates, loading: templatesLoading, refetch: refetchTemplates } = useFetch(carbonApi.getTemplates)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { activityType: '', quantity: '', electricityMode: 'NORMAL' },
  })

  const watchType = watch('activityType')
  const watchQty = watch('quantity')
  const watchElectricityMode = watch('electricityMode')
  const selectedActivityInfo = watchType ? ACTIVITY_EXPLAINERS[watchType] : null
  const selectedElectricityMode = ELECTRICITY_USAGE_MODES[watchElectricityMode] || ELECTRICITY_USAGE_MODES.NORMAL
  const effectiveQuantity = getEffectiveQuantity(watchType, watchQty, watchElectricityMode)
  const quantityUnit = watchType === 'ELECTRICITY' ? 'hours' : getActivityUnit(watchType)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        activityType: data.activityType,
        quantity: getEffectiveQuantity(data.activityType, data.quantity, data.electricityMode),
      }

      const res = await carbonApi.addEntry(payload)
      setLastAdded(res.data)
      toast.success(`Entry added! ${formatCarbonShort(res.data.carbonAmount)} CO2`)

      if (saveTemplate && templateName.trim()) {
        try {
          await carbonApi.createTemplate({
            name: templateName.trim(),
            activityType: payload.activityType,
            quantity: payload.quantity,
          })
          toast.success('Template saved')
          refetchTemplates()
        } catch (error) {
          toast.error('Template save failed: ' + getErrorMessage(error))
        }
      }

      reset()
      setSaveTemplate(false)
      setTemplateName('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const useTemplate = async (id) => {
    try {
      const res = await carbonApi.useTemplate(id)
      setLastAdded(res.data)
      toast.success(`Quick entry added - ${formatCarbonShort(res.data.carbonAmount)}`)
      refetchTemplates()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const deleteTemplate = async (id) => {
    try {
      await carbonApi.deleteTemplate(id)
      toast.success('Template deleted')
      refetchTemplates()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const simulate = async () => {
    if (!watchType || !watchQty) {
      toast.error('Fill in activity and quantity first')
      return
    }

    setSimLoading(true)
    try {
      const currentQuantity = getEffectiveQuantity(watchType, watchQty, watchElectricityMode)
      const res = await carbonApi.simulateImpact({
        activityType: watchType,
        currentQuantity,
        plannedQuantity: roundToTwo(currentQuantity * 0.7),
        frequencyPerWeek: 5,
      })
      setSimResult(res.data)
      setShowSimulate(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Add Carbon Entry</h1>
        <p className="page-subtitle">Log your daily activities to track your carbon footprint</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <SectionHeader title="New Entry" subtitle="Record an activity's carbon impact" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Activity type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                      watchType === type
                        ? 'border-brand-600/60 bg-brand-900/30 text-brand-300'
                        : 'border-surface-400/30 bg-surface-700/30 text-slate-400 hover:border-surface-400/60 hover:text-slate-300'
                    }`}
                  >
                    <input
                      {...register('activityType')}
                      type="radio"
                      value={type}
                      className="sr-only"
                    />
                    {getActivityLabel(type)}
                  </label>
                ))}
              </div>

              {selectedActivityInfo ? (
                <div className="mt-3 rounded-2xl border border-brand-700/30 bg-brand-900/15 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/15">
                      <Zap className="h-4 w-4 text-brand-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">
                        How {getActivityLabel(watchType)} creates emissions
                      </p>
                      <p className="text-sm leading-6 text-slate-300">{selectedActivityInfo.why}</p>
                      <p className="text-xs leading-5 text-slate-400">
                        <span className="font-medium text-slate-300">When to use it:</span> {selectedActivityInfo.use}
                      </p>
                      <p className="text-xs leading-5 text-brand-300">
                        <span className="font-medium">Helpful note:</span> {selectedActivityInfo.tip}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Select an activity to see how that entry releases carbon and when to use it.
                </p>
              )}

              {errors.activityType && <p className="form-error mt-1">{errors.activityType.message}</p>}
            </div>

            <div>
              <label className="label">
                Quantity {watchType ? `(${quantityUnit})` : ''}
              </label>
              <input
                {...register('quantity')}
                type="number"
                step="0.01"
                min="0.01"
                placeholder={`Enter amount in ${watchType ? quantityUnit : 'units'}`}
                className="input-field"
              />

              {watchType === 'ELECTRICITY' && (
                <div className="mt-2 rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-3">
                  <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">Usage level</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {Object.entries(ELECTRICITY_USAGE_MODES).map(([mode, option]) => (
                        <label
                          key={mode}
                          className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                            watchElectricityMode === mode
                              ? 'border-cyan-300/60 bg-cyan-500/10 text-white'
                              : 'border-surface-400/25 bg-surface-800/40 text-slate-400 hover:border-cyan-400/35 hover:text-slate-200'
                          }`}
                        >
                          <input
                            {...register('electricityMode')}
                            type="radio"
                            value={mode}
                            className="sr-only"
                          />
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="mt-1 text-[11px] leading-5">{option.kwhPerHour} kWh/hour</p>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {selectedElectricityMode.description}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-slate-300">
                    Enter the number of hours you used electricity. We will estimate your usage using
                    {' '}<span className="font-medium text-cyan-300">{selectedElectricityMode.kwhPerHour} kWh per hour</span>
                    {' '}for the selected usage level.
                  </p>
                  <p className="mt-1 text-xs text-cyan-300">
                    Estimated electricity used: {effectiveQuantity ? `${effectiveQuantity} kWh` : '0 kWh'}
                  </p>
                </div>
              )}

              {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="saveTemplate"
                type="checkbox"
                checked={saveTemplate}
                onChange={(e) => setSaveTemplate(e.target.checked)}
                className="w-4 h-4 rounded border-surface-400 bg-surface-700 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="saveTemplate" className="text-sm text-slate-400 cursor-pointer">
                Save as quick-entry template
              </label>
            </div>

            {saveTemplate && (
              <div>
                <label className="label">Template name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Daily commute"
                  className="input-field"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Add Entry</>}
              </button>
              <button
                type="button"
                onClick={simulate}
                disabled={simLoading}
                className="btn-secondary"
              >
                {simLoading ? <Spinner size="sm" /> : 'Simulate'}
              </button>
            </div>
          </form>

          {lastAdded && (
            <div className="mt-5 p-4 bg-brand-900/20 border border-brand-700/30 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-300">Entry logged successfully</p>
                <p className="text-xs text-slate-400">
                  {getActivityLabel(lastAdded.activityType)} - {formatCarbonShort(lastAdded.carbonAmount)} CO2
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader
            title="Quick Templates"
            subtitle="Reuse saved entries"
            action={<BookmarkPlus className="w-4 h-4 text-slate-500" />}
          />

          {templatesLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : templates?.length ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-700/40 border border-surface-500/20 hover:border-surface-400/40 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{template.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {getActivityLabel(template.activityType)} | {template.quantity} {getActivityUnit(template.activityType)}
                    </p>
                    <p className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Used {template.useCount}x
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => useTemplate(template.id)}
                      className="p-1.5 rounded-lg bg-brand-900/40 text-brand-400 hover:bg-brand-900/70 transition-colors text-xs"
                      title="Use template"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookmarkPlus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No templates yet</p>
              <p className="text-xs text-slate-600 mt-1">Check "Save as template" when adding</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showSimulate} onClose={() => setShowSimulate(false)} title="Impact Simulation">
        {simResult && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{simResult.message}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Current monthly', value: formatCarbonShort(simResult.currentMonthlyEmission), color: 'text-red-400' },
                { label: 'Planned monthly', value: formatCarbonShort(simResult.plannedMonthlyEmission), color: 'text-brand-400' },
                { label: 'Monthly savings', value: formatCarbonShort(simResult.monthlySavingsKg), color: 'text-white' },
                { label: 'Yearly savings', value: formatCarbonShort(simResult.yearlySavingsKg), color: 'text-white' },
                { label: 'Trees equivalent', value: `${simResult.treesEquivalent?.toFixed(1) || 0} trees`, color: 'text-brand-400' },
                { label: 'Km avoided', value: `${simResult.kmDrivenEquivalent?.toFixed(0) || 0} km`, color: 'text-slate-300' },
              ].map((summary) => (
                <div key={summary.label} className="bg-surface-700/40 rounded-lg p-3">
                  <p className="text-[11px] text-slate-500">{summary.label}</p>
                  <p className={`text-base font-semibold mt-0.5 ${summary.color}`}>{summary.value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSimulate(false)} className="btn-secondary w-full">Close</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
