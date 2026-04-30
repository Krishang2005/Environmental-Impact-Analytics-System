import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CloudSun,
  Factory,
  Languages,
  Sparkles,
  Trees,
} from 'lucide-react'
import CinematicBackground from '../../components/fx/CinematicBackground'

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

const content = {
  en: {
    badge: 'Environmental Intelligence Platform',
    title: 'CarbonTrack helps people and admins understand emissions before pollution becomes damage',
    subtitle: 'Track carbon activities, compare zones, study pollution pressure, and act early with reports, alerts, and AI-style insights.',
    whatTitle: 'What this website is about',
    whatBody: 'CarbonTrack is a climate and carbon monitoring website. It records activities such as transport, electricity, fuel, and waste, converts them into carbon values, and helps both users and admins understand how daily actions affect the environment.',
    worksTitle: 'How it works',
    worksBody: 'Users log their daily carbon activities. The system calculates emissions, compares them with zone limits, shows dashboard reports, and sends reminders when the trend starts moving toward the risky border. Admins can manage zones, users, streaks, and future pressure insights.',
    dangerTitle: 'How pollution damages the atmosphere',
    dangerBody: 'Pollution adds greenhouse gases and harmful particles to the air. These gases trap more heat, increase climate stress, reduce air quality, disturb rainfall patterns, and worsen public health. If emissions continue rising, cities face more heat, unstable seasons, and environmental imbalance.',
    steps: [
      'Collect activity data from transport, power, fuel, and waste.',
      'Convert daily actions into measurable carbon emissions.',
      'Compare users and zones with safer emission limits.',
      'Generate alerts, analytics, and future risk guidance.',
    ],
    cards: [
      { title: 'Air quality', value: 'CO2 and particulate rise', note: 'Pollution lowers breathing safety and urban comfort.' },
      { title: 'Heat stress', value: 'Temperature pressure', note: 'More trapped heat makes cities hotter and harsher.' },
      { title: 'Climate shift', value: 'Rainfall imbalance', note: 'Seasonal patterns become less stable over time.' },
    ],
    login: 'Login',
    userLogin: 'User Login',
    adminLogin: 'Admin Login',
    langLabel: 'Language',
  },
  kn: {
    badge: 'ಪರಿಸರ ಬುದ್ಧಿವಂತಿಕೆ ವೇದಿಕೆ',
    title: 'CarbonTrack ಮಾಲಿನ್ಯವು ಹಾನಿಯಾಗುವ ಮೊದಲು ಉತ್ಸರ್ಜನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಜನರು ಮತ್ತು ಆಡಳಿತಗಾರರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ',
    subtitle: 'ಕಾರ್ಬನ್ ಚಟುವಟಿಕೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ವಲಯಗಳನ್ನು ಹೋಲಿಸಿ, ಮಾಲಿನ್ಯದ ಒತ್ತಡವನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ, ವರದಿಗಳು, ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು AI ಶೈಲಿಯ ಒಳನೋಟಗಳೊಂದಿಗೆ ಮುಂಚಿತವಾಗಿ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ.',
    whatTitle: 'ಈ ವೆಬ್‌ಸೈಟ್ ಏನಿಗಾಗಿ',
    whatBody: 'CarbonTrack ಹವಾಮಾನ ಮತ್ತು ಕಾರ್ಬನ್ ನಿಗಾವಹಿಸುವ ವೆಬ್‌ಸೈಟ್ ಆಗಿದೆ. ಇದು ಸಾರಿಗೆ, ವಿದ್ಯುತ್, ಇಂಧನ ಮತ್ತು ತ್ಯಾಜ್ಯ ಚಟುವಟಿಕೆಗಳನ್ನು ದಾಖಲಿಸಿ, ಅವುಗಳನ್ನು ಕಾರ್ಬನ್ ಮೌಲ್ಯಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ. ಇದರಿಂದ ಬಳಕೆದಾರರು ಮತ್ತು ಆಡಳಿತಗಾರರು ದಿನನಿತ್ಯದ ಕ್ರಿಯೆಗಳು ಪರಿಸರದ ಮೇಲೆ ಹೇಗೆ ಪರಿಣಾಮ ಬೀರುತ್ತವೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಹುದು.',
    worksTitle: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    worksBody: 'ಬಳಕೆದಾರರು ತಮ್ಮ ದಿನನಿತ್ಯದ ಕಾರ್ಬನ್ ಚಟುವಟಿಕೆಗಳನ್ನು ದಾಖಲಿಸುತ್ತಾರೆ. ವ್ಯವಸ್ಥೆ ಉತ್ಸರ್ಜನೆಯನ್ನು ಲೆಕ್ಕ ಹಾಕಿ, ವಲಯ ಮಿತಿಗಳೊಂದಿಗೆ ಹೋಲಿಸುತ್ತದೆ, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವರದಿಗಳನ್ನು ತೋರಿಸುತ್ತದೆ ಮತ್ತು ಅಪಾಯದ ಗಡಿಯತ್ತ ಪ್ರವೃತ್ತಿ ಸಾಗುವ ಮೊದಲು ಎಚ್ಚರಿಕೆಗಳನ್ನು ಕಳುಹಿಸುತ್ತದೆ. ಆಡಳಿತಗಾರರು ವಲಯಗಳು, ಬಳಕೆದಾರರು, ಸ್ಟ್ರೀಕ್‌ಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಒತ್ತಡದ ಒಳನೋಟಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದು.',
    dangerTitle: 'ಮಾಲಿನ್ಯವು ವಾತಾವರಣವನ್ನು ಹೇಗೆ ಹಾನಿಗೊಳಿಸುತ್ತದೆ',
    dangerBody: 'ಮಾಲಿನ್ಯವು ಗಾಳಿಗೆ ಹಾನಿಕಾರಕ ಕಣಗಳು ಮತ್ತು ಹಸಿರುಮನೆ ಅನಿಲಗಳನ್ನು ಸೇರಿಸುತ್ತದೆ. ಇವು ಹೆಚ್ಚು ಬಿಸಿಯನ್ನು ಹಿಡಿದುಕೊಂಡು ಹವಾಮಾನ ಒತ್ತಡವನ್ನು ಹೆಚ್ಚಿಸುತ್ತವೆ, ಗಾಳಿಯ ಗುಣಮಟ್ಟವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತವೆ, ಮಳೆಯ ಮಾದರಿಯನ್ನು ಅಸ್ಥಿರಗೊಳಿಸುತ್ತವೆ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯವನ್ನು ಹಾಳುಮಾಡುತ್ತವೆ. ಉತ್ಸರ್ಜನೆಗಳು ಮುಂದುವರಿದರೆ ನಗರಗಳು ಹೆಚ್ಚು ಬಿಸಿ, ಅಸ್ಥಿರ ಋತುಗಳು ಮತ್ತು ಪರಿಸರ ಅಸಮತೋಲನವನ್ನು ಎದುರಿಸಬೇಕಾಗುತ್ತದೆ.',
    steps: [
      'ಸಾರಿಗೆ, ವಿದ್ಯುತ್, ಇಂಧನ ಮತ್ತು ತ್ಯಾಜ್ಯ ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸಿ.',
      'ದೈನಂದಿನ ಚಟುವಟಿಕೆಗಳನ್ನು ಅಳೆಯಬಹುದಾದ ಕಾರ್ಬನ್ ಉತ್ಸರ್ಜನೆಯಾಗಿ ಪರಿವರ್ತಿಸಿ.',
      'ಬಳಕೆದಾರರು ಮತ್ತು ವಲಯಗಳನ್ನು ಸುರಕ್ಷಿತ ಉತ್ಸರ್ಜನಾ ಮಿತಿಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ.',
      'ಎಚ್ಚರಿಕೆಗಳು, ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಭವಿಷ್ಯದ ಅಪಾಯ ಮಾರ್ಗದರ್ಶನವನ್ನು ಸಿದ್ಧಪಡಿಸಿ.',
    ],
    cards: [
      { title: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ', value: 'CO2 ಮತ್ತು ಕಣಗಳ ಹೆಚ್ಚಳ', note: 'ಮಾಲಿನ್ಯವು ಉಸಿರಾಟದ ಸುರಕ್ಷತೆ ಮತ್ತು ನಗರ ಜೀವನದ ಆರಾಮವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.' },
      { title: 'ಬಿಸಿ ಒತ್ತಡ', value: 'ತಾಪಮಾನ ಒತ್ತಡ', note: 'ಹೆಚ್ಚು ಹಿಡಿದ ಬಿಸಿ ನಗರಗಳನ್ನು ಇನ್ನಷ್ಟು ಬಿಸಿ ಮತ್ತು ಕಠಿಣವಾಗಿಸುತ್ತದೆ.' },
      { title: 'ಹವಾಮಾನ ಬದಲಾವಣೆ', value: 'ಮಳೆಯ ಅಸಮತೋಲನ', note: 'ಋತುಚಕ್ರದ ಮಾದರಿಗಳು ಕಾಲಕ್ರಮೇಣ ಕಡಿಮೆ ಸ್ಥಿರವಾಗುತ್ತವೆ.' },
    ],
    login: 'ಲಾಗಿನ್',
    userLogin: 'ಬಳಕೆದಾರ ಲಾಗಿನ್',
    adminLogin: 'ಆಡಳಿತ ಲಾಗಿನ್',
    langLabel: 'ಭಾಷೆ',
  },
}

function LanguageToggle({ language, onChange, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-surface-400/40 bg-surface-800/85 p-1.5 text-xs shadow-lg backdrop-blur">
      <div className="flex items-center gap-1 px-2 text-slate-400">
        <Languages className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="flex rounded-xl bg-surface-700/70 p-1">
        {languageOptions.map((option) => {
          const active = language === option.code
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                active ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [language, setLanguage] = useState('en')
  const copy = content[language]

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-8">
      <CinematicBackground withMouseGlow={false} />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div className="absolute left-[-8%] top-[4%] h-[20rem] w-[20rem] rounded-full bg-brand-500/18 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[22rem] w-[22rem] rounded-full bg-emerald-400/15 blur-[130px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-surface-500/20 bg-surface-800/55 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/carbontrack-nexus-logo.png"
              alt="CarbonTrack Nexus logo"
              className="h-16 w-auto rounded-2xl bg-white/90 p-1.5 shadow-[0_0_24px_rgba(74,222,128,0.35)]"
            />
            <div>
              <p className="text-xl font-semibold text-white">CarbonTrack Nexus</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-brand-300">Climate Awareness Platform</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <LanguageToggle language={language} onChange={setLanguage} label={copy.langLabel} />
            <div className="flex gap-3">
              <Link to="/login" className="btn-primary">
                {copy.userLogin}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/login" className="btn-secondary">
                {copy.adminLogin}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand-200">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {copy.badge}
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-300">
              {copy.subtitle}
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {copy.cards.map((card, index) => {
                const Icon = index === 0 ? CloudSun : index === 1 ? Factory : Trees
                return (
                  <div key={card.title} className="rounded-3xl border border-surface-500/20 bg-surface-800/60 p-5">
                    <Icon className="mb-3 h-5 w-5 text-brand-300" />
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-lg font-bold text-brand-300">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{card.note}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-surface-500/20 bg-surface-800/55 p-6">
                <h2 className="text-lg font-semibold text-white">{copy.whatTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{copy.whatBody}</p>
              </div>
              <div className="rounded-[28px] border border-surface-500/20 bg-surface-800/55 p-6">
                <h2 className="text-lg font-semibold text-white">{copy.worksTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{copy.worksBody}</p>
              </div>
              <div className="rounded-[28px] border border-surface-500/20 bg-surface-800/55 p-6">
                <h2 className="text-lg font-semibold text-white">{copy.dangerTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{copy.dangerBody}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[34px] border border-surface-500/20 bg-gradient-to-br from-surface-800 via-[#0f1815] to-surface-900 p-6 shadow-2xl">
              <div className="absolute -right-8 top-0 h-44 w-44 rounded-full bg-brand-500/15 blur-3xl" />
              <div className="absolute -bottom-10 left-12 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative min-h-[620px]">
                <div className="absolute left-1/2 top-6 h-64 w-64 -translate-x-1/2 md:h-72 md:w-72">
                  <div className="absolute inset-0 rounded-full border border-emerald-200/25 bg-gradient-to-br from-[#163d33] via-[#0f4e43] to-[#0a231d] shadow-[0_25px_60px_rgba(0,0,0,0.45)]" />
                  <div className="absolute inset-2 rounded-full border border-emerald-200/20 bg-[#0b2a22]/88 p-3 md:p-4">
                    <img
                      src="/carbontrack-nexus-logo.png"
                      alt="CarbonTrack Nexus logo"
                      className="h-[72%] w-full rounded-[28px] object-contain bg-white/95 p-2 shadow-[0_8px_28px_rgba(34,197,94,0.28)]"
                    />
                    <div className="mt-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-center">
                      <p className="text-xs font-semibold tracking-[0.18em] text-emerald-100 md:text-sm">CARBONTRACK NEXUS</p>
                    </div>
                  </div>

                  <div className="absolute inset-[-14px] rounded-full border border-emerald-300/25 animate-pulse-slow" />
                  <div className="absolute inset-[-28px] rounded-full border border-teal-300/20 animate-[spin_24s_linear_infinite]">
                    <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.7)]" />
                  </div>
                  <div className="absolute inset-[-40px] rounded-full border border-emerald-300/12 animate-[spin_34s_linear_infinite_reverse]" />
                </div>

                <div className="absolute left-4 top-56 w-44 rotate-[-8deg] rounded-3xl border border-surface-400/20 bg-surface-800/80 p-4 shadow-xl">
                  <Factory className="mb-2 h-5 w-5 text-brand-300" />
                  <p className="text-xs font-semibold text-white">{language === 'kn' ? 'ಮಾಲಿನ್ಯ ಮೂಲಗಳು' : 'Pollution Sources'}</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    {language === 'kn'
                      ? 'ಇಂಧನ, ಸಾರಿಗೆ, ಕೈಗಾರಿಕೆ ಮತ್ತು ತ್ಯಾಜ್ಯದಿಂದ ಉತ್ಸರ್ಜನೆ ಹೆಚ್ಚಾಗುತ್ತದೆ.'
                      : 'Emissions rise from fuel, transport, industry, and waste.'}
                  </p>
                </div>

                <div className="absolute right-3 top-72 w-44 rotate-[9deg] rounded-3xl border border-surface-400/20 bg-surface-800/80 p-4 shadow-xl">
                  <CloudSun className="mb-2 h-5 w-5 text-teal-300" />
                  <p className="text-xs font-semibold text-white">{language === 'kn' ? 'ವಾತಾವರಣದ ಒತ್ತಡ' : 'Atmosphere Stress'}</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    {language === 'kn'
                      ? 'ಹೆಚ್ಚಿದ ಬಿಸಿ, ಕುಸಿಯುವ ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಮತ್ತು ಅಸ್ಥಿರ ಮಳೆಯ ಮಾದರಿಗಳು.'
                      : 'More heat, weaker air quality, and unstable rainfall patterns.'}
                  </p>
                </div>

                <div className="absolute bottom-6 left-1/2 w-[92%] -translate-x-1/2 rounded-[30px] border border-surface-400/20 bg-surface-800/85 p-5 backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        {language === 'kn' ? 'ಕ್ರಿಯೆಯ ಹರಿವು' : 'Action Flow'}
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {language === 'kn' ? 'ಡೇಟಾದಿಂದ ಉತ್ತಮ ಹವಾಮಾನ ನಿರ್ಧಾರಗಳ ಕಡೆಗೆ' : 'From data to better climate decisions'}
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-brand-300" />
                  </div>

                  <div className="space-y-3">
                    {copy.steps.map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-200">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-slate-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
