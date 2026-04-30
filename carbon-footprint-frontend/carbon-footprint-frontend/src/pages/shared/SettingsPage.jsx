import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Cpu, Gauge, Palette, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { NeoButton, NeoCard, NeoSlider, NeoSwitch } from '../../components/ui/shadcn'

function SettingRow({ icon: Icon, title, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-400/20 bg-slate-900/70 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-500/10 text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <NeoSwitch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const [settings, setSettings] = useState({
    cinematicMode: true,
    liveNotifications: true,
    aiAutoRecommendations: true,
    enhancedSecurity: isAdmin,
    motionDepth: 72,
    hologramIntensity: 65,
  })

  const environmentLabel = useMemo(
    () => (isAdmin ? 'Admin Control Matrix Settings' : 'User Experience Settings'),
    [isAdmin]
  )

  const updateSetting = (key, value) => {
    setSettings((previous) => ({ ...previous, [key]: value }))
  }

  const saveSettings = () => {
    toast.success('Interface settings updated')
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">{environmentLabel}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4"
      >
        <NeoCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Visual Interface</p>
              <p className="text-xs text-slate-400">Tune depth, hologram glow, and cinematic UI effects.</p>
            </div>
            <Sparkles className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="space-y-3">
            <SettingRow
              icon={Palette}
              title="Cinematic Mode"
              description="Enable animated particles, neon gradients, and premium panel effects."
              checked={settings.cinematicMode}
              onCheckedChange={(value) => updateSetting('cinematicMode', value)}
            />
            <SettingRow
              icon={Bell}
              title="Live Notifications"
              description="Show real-time alerts and operational status updates."
              checked={settings.liveNotifications}
              onCheckedChange={(value) => updateSetting('liveNotifications', value)}
            />
            <SettingRow
              icon={Cpu}
              title="AI Auto Recommendations"
              description="Let Carbon Copilot suggest personalized actions continuously."
              checked={settings.aiAutoRecommendations}
              onCheckedChange={(value) => updateSetting('aiAutoRecommendations', value)}
            />
            <SettingRow
              icon={ShieldCheck}
              title="Enhanced Security Layer"
              description="Apply stronger session checks and hardened control workflow."
              checked={settings.enhancedSecurity}
              onCheckedChange={(value) => updateSetting('enhancedSecurity', value)}
            />
          </div>
        </NeoCard>

        <NeoCard>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Motion Calibration</p>
              <p className="text-xs text-slate-400">Refine animation intensity and depth behavior.</p>
            </div>
            <Gauge className="h-4 w-4 text-indigo-300" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Motion depth</span>
                <span>{settings.motionDepth}%</span>
              </div>
              <NeoSlider
                value={[settings.motionDepth]}
                min={20}
                max={100}
                step={1}
                onValueChange={(values) => updateSetting('motionDepth', values[0])}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Hologram intensity</span>
                <span>{settings.hologramIntensity}%</span>
              </div>
              <NeoSlider
                value={[settings.hologramIntensity]}
                min={10}
                max={100}
                step={1}
                onValueChange={(values) => updateSetting('hologramIntensity', values[0])}
              />
            </div>

            <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-400">
                Profile presets can be attached later to user role policies or admin environment templates.
              </p>
            </div>

            <NeoButton variant="primary" size="lg" className="w-full" onClick={saveSettings}>
              Save Settings
            </NeoButton>
          </div>
        </NeoCard>
      </motion.div>
    </div>
  )
}
