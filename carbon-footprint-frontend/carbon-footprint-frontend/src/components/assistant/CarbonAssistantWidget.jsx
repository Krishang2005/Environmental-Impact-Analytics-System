import { useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  Bot,
  Camera,
  Mail,
  Medal,
  MessageCircleMore,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Target,
  Trophy,
  User as UserIcon,
  X,
} from 'lucide-react'
import { carbonApi } from '../../api/carbonApi'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'

function createWelcomeMessage(name) {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `I'm Carbon Copilot, ${name || 'there'}. I can help with your profile, daily carbon habits, zone limit, monthly goal progress, and launch smart complaint reporting for vehicle emissions or garbage issues.`,
    insights: [
      'Profile-aware guidance',
      'Uses your live emission totals',
      'Tracks your monthly reduction goals',
    ],
    followUps: [
      'How can I reduce my emissions this week?',
      'Am I close to my zone limit?',
      'How is my monthly reduction goal progressing?',
      'How do I report a vehicle emission complaint?',
    ],
  }
}

function buildHistory(messages) {
  return messages
    .filter((message) => message.id !== 'welcome')
    .slice(-6)
    .map((message) => ({
      role: message.role,
      text: message.text,
    }))
}

function isGreetingMessage(value) {
  const normalized = value.trim().toLowerCase()
  return [
    'hi',
    'hello',
    'hey',
    'hii',
    'hiii',
    'good morning',
    'good afternoon',
    'good evening',
  ].includes(normalized)
}

function createGreetingReply() {
  return {
    id: `assistant-greeting-${Date.now()}`,
    role: 'assistant',
    text: "Hello! I'm Carbon Copilot. I can help with your zone limit, your highest emission source, your profile habits, and your goal progress.",
    insights: [],
    followUps: [
      'Am I close to my zone limit?',
      'What is my highest emission source?',
      'How is my monthly reduction goal progressing?',
    ],
    riskLevel: 'SAFE',
  }
}

function formatKg(value) {
  return `${Number(value || 0).toFixed(1)} kg`
}

function normalizeVoiceInput(value) {
  return value
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripWakeWord(value) {
  return value.replace(/^hey\s+(?:ecotrack|eco\s*track|carbon\s*copilot)\s*[,:-]?\s*/i, '').trim()
}

function parseVoiceCommand(input) {
  const normalized = stripWakeWord(normalizeVoiceInput(input))
  if (!normalized) {
    return null
  }

  const carTravelMatch = normalized.match(
    /(?:log|add)\s+(\d+(?:\.\d+)?)\s*(?:km|kilometer|kilometers)\s*(?:of\s*)?(?:car(?:\s+travel)?|driving)/
  )
  if (carTravelMatch) {
    return {
      type: 'LOG_CAR_TRAVEL',
      quantity: Number(carTravelMatch[1]),
      normalized,
    }
  }

  if (
    normalized.includes('emission today')
    || normalized.includes('today emission')
    || normalized.includes('emit today')
    || normalized.includes('my emission for today')
  ) {
    return { type: 'TODAY_EMISSION', normalized }
  }

  const goalMatch = normalized.match(
    /set(?:\s+my)?\s+goal(?:\s+to)?\s+reduce(?:\s+by)?\s+(\d+(?:\.\d+)?)\s*%?(?:\s+this\s+month)?/
  )
  if (goalMatch) {
    return {
      type: 'SET_MONTHLY_GOAL',
      targetReductionPct: Number(goalMatch[1]),
      normalized,
    }
  }

  return {
    type: 'FALLBACK_CHAT',
    normalized,
  }
}

export default function CarbonAssistantWidget() {
  const { user } = useAuth()
  const recognitionRef = useRef(null)
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState(() => [createWelcomeMessage(user?.name)])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [goalProgress, setGoalProgress] = useState(null)
  const [goalTargetDraft, setGoalTargetDraft] = useState('20')
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)
  const [summarySending, setSummarySending] = useState(false)
  const [goalNotice, setGoalNotice] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState('')
  const [lastVoiceTranscript, setLastVoiceTranscript] = useState('')

  const addUserMessage = (text) => {
    setMessages((previous) => [
      ...previous,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        insights: [],
        followUps: [],
      },
    ])
  }

  const addAssistantMessage = (text, insights = [], followUps = []) => {
    setMessages((previous) => [
      ...previous,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text,
        insights,
        followUps,
        riskLevel: 'SAFE',
      },
    ])
  }

  const speak = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const loadGoalProgress = async () => {
    setGoalLoading(true)
    setGoalNotice('')

    try {
      const res = await userApi.getGoalProgress()
      const data = res.data
      setGoalProgress(data)
      setGoalTargetDraft(String(Math.round(data?.targetReductionPct || 20)))
    } catch (error) {
      setGoalNotice(error?.response?.data?.message || 'Goal tracker is unavailable right now.')
    } finally {
      setGoalLoading(false)
    }
  }

  useEffect(() => {
    setMessages([createWelcomeMessage(user?.name)])
    setDraft('')
    if (user) {
      loadGoalProgress()
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
    setVoiceSupported(Boolean(SpeechRecognition))
    if (!SpeechRecognition) {
      setVoiceNotice('Voice commands are not supported in this browser.')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          // no-op
        }
      }
    }
  }, [])

  const updateGoalSettings = async (payload) => {
    setGoalSaving(true)
    setGoalNotice('')

    try {
      const res = await userApi.updateGoalSettings(payload)
      const data = res.data
      setGoalProgress(data)
      if (payload.targetReductionPct != null) {
        setGoalTargetDraft(String(Math.round(data?.targetReductionPct || payload.targetReductionPct)))
      }
      return data
    } catch (error) {
      setGoalNotice(error?.response?.data?.message || 'Could not save goal settings right now.')
      return null
    } finally {
      setGoalSaving(false)
    }
  }

  const submitGoalTarget = async (event) => {
    event.preventDefault()
    const target = Number(goalTargetDraft)

    if (Number.isNaN(target) || target < 5 || target > 60) {
      setGoalNotice('Please choose a monthly reduction target between 5% and 60%.')
      return
    }

    await updateGoalSettings({ targetReductionPct: target })
  }

  const toggleWeeklySummary = async () => {
    if (!goalProgress) return
    await updateGoalSettings({ weeklySummaryEnabled: !goalProgress.weeklySummaryEnabled })
  }

  const sendWeeklySummaryNow = async () => {
    setSummarySending(true)
    setGoalNotice('')

    try {
      await userApi.sendGoalWeeklySummary()
      setGoalNotice('Weekly summary email sent.')
      await loadGoalProgress()
    } catch (error) {
      setGoalNotice(error?.response?.data?.message || 'Could not send weekly summary right now.')
    } finally {
      setSummarySending(false)
    }
  }

  const executeVoiceCommand = async (command, rawTranscript) => {
    if (!command) return

    if (command.type === 'FALLBACK_CHAT') {
      await sendMessage(command.normalized)
      return
    }

    addUserMessage(rawTranscript)

    if (command.type === 'LOG_CAR_TRAVEL') {
      if (!command.quantity || command.quantity <= 0) {
        const invalidText = 'I could not detect a valid distance. Try: "Hey EcoTrack, log 50 km car travel."'
        addAssistantMessage(invalidText)
        speak(invalidText)
        return
      }

      try {
        const res = await carbonApi.addEntry({
          activityType: 'CAR',
          quantity: command.quantity,
        })

        const loggedEntry = res.data
        await loadGoalProgress()
        const replyText = `Done. Logged ${command.quantity} km car travel. Added emission: ${formatKg(loggedEntry?.carbonAmount || 0)}.`
        addAssistantMessage(replyText, ['Voice logging complete'], [
          "What's my emission today?",
          'How is my monthly reduction goal progressing?',
        ])
        speak(replyText)
      } catch (error) {
        const errorText = error?.response?.data?.message || 'I could not log that travel right now. Please try again.'
        addAssistantMessage(errorText)
        speak(errorText)
      }
      return
    }

    if (command.type === 'TODAY_EMISSION') {
      try {
        const res = await userApi.getDashboard()
        const dashboard = res.data || {}
        const replyText = `Today you emitted ${formatKg(dashboard.todayEmission)}. Your monthly total is ${formatKg(dashboard.monthlyEmission)}.`
        addAssistantMessage(replyText, ['Live dashboard data'], [
          'Am I close to my zone limit?',
          'Set goal to reduce 20% this month',
        ])
        speak(replyText)
      } catch (error) {
        const errorText = error?.response?.data?.message || 'I could not fetch your dashboard right now.'
        addAssistantMessage(errorText)
        speak(errorText)
      }
      return
    }

    if (command.type === 'SET_MONTHLY_GOAL') {
      const target = Number(command.targetReductionPct)
      if (Number.isNaN(target) || target < 5 || target > 60) {
        const rangeText = 'Goal target should be between 5% and 60%.'
        addAssistantMessage(rangeText)
        speak(rangeText)
        return
      }

      const data = await updateGoalSettings({ targetReductionPct: target })
      if (!data) {
        const errorText = 'I could not update your monthly goal right now.'
        addAssistantMessage(errorText)
        speak(errorText)
        return
      }

      const replyText = `Goal updated. You are now targeting a ${data.targetReductionPct}% reduction this month. Current progress is ${data.progressPct}%.`
      addAssistantMessage(replyText, ['Voice goal update complete'], [
        "What's my emission today?",
        'How should I improve my profile habits?',
      ])
      speak(replyText)
    }
  }

  const processVoiceTranscript = async (transcript) => {
    const trimmed = transcript?.trim()
    if (!trimmed) return

    setLastVoiceTranscript(trimmed)
    setVoiceNotice('Processing your command...')
    const command = parseVoiceCommand(trimmed)
    await executeVoiceCommand(command, trimmed)
    setVoiceNotice('Voice command processed.')
  }

  const startVoiceListening = () => {
    if (voiceListening || voiceBusy || sending) return

    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
    if (!SpeechRecognition) {
      setVoiceNotice('Voice commands are not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setVoiceListening(true)
      setVoiceNotice('Listening... say "Hey EcoTrack, log 50 km car travel".')
    }

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .trim()

      if (!transcript) return
      setVoiceBusy(true)
      try {
        await processVoiceTranscript(transcript)
      } finally {
        setVoiceBusy(false)
      }
    }

    recognition.onerror = (event) => {
      setVoiceNotice(event?.error === 'no-speech' ? 'No speech detected. Try again.' : 'Voice recognition failed.')
    }

    recognition.onend = () => {
      setVoiceListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoiceListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
  }

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
  const followUpPrompts = lastAssistantMessage?.followUps || []

  const openSmartComplaints = () => {
    if (typeof window === 'undefined') return
    window.location.assign('/smart-complaints')
  }

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || sending) return

    const history = buildHistory(messages)
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      insights: [],
      followUps: [],
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')

    if (isGreetingMessage(message)) {
      setMessages((previous) => [...previous, createGreetingReply()])
      return
    }

    setSending(true)

    try {
      const res = await userApi.chatWithAssistant(message, history)
      const reply = res.data

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: reply?.answer || 'I could not build a response right now.',
          insights: reply?.insights || [],
          followUps: reply?.followUpPrompts || [],
          riskLevel: reply?.riskLevel || 'SAFE',
        },
      ])
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: error?.response?.data?.message || 'I could not reach Carbon Copilot right now. Please try again.',
          insights: [],
          followUps: [],
          riskLevel: 'SAFE',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await sendMessage(draft)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-brand-500/30 bg-surface-800/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur transition hover:border-brand-400/50 hover:bg-surface-700/95"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
          <MessageCircleMore className="h-5 w-5" />
        </span>
        <span className="hidden sm:inline">Carbon Copilot</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-1.5rem)] max-w-[390px]">
      <div className="glass-card flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden border border-surface-400/50 shadow-2xl">
        <div className="border-b border-surface-500/20 bg-surface-800/90 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Carbon Copilot</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-200">
                    <Sparkles className="h-3 w-3" />
                    Personal
                  </span>
                </div>
                <p className="text-xs text-slate-400">Profile help, goals, and daily carbon guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={voiceListening ? stopVoiceListening : startVoiceListening}
                disabled={!voiceSupported || voiceBusy || sending}
                className={`flex h-9 items-center gap-1 rounded-full border px-3 text-xs transition disabled:opacity-50 ${
                  voiceListening
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                    : 'border-surface-500/30 bg-surface-700/50 text-slate-300 hover:border-surface-400/50 hover:bg-surface-700/80 hover:text-white'
                }`}
                aria-label={voiceListening ? 'Stop voice input' : 'Start voice input'}
                title={voiceListening ? 'Stop voice input' : 'Start voice input'}
              >
                {voiceListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {voiceListening ? 'Stop' : 'Voice'}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-surface-500/30 bg-surface-700/50 text-slate-300 transition hover:border-surface-400/50 hover:bg-surface-700/80 hover:text-white"
                aria-label="Close assistant"
                title="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">Voice Assistant</p>
                <p className="mt-1 text-[11px] leading-relaxed text-sky-100/90">
                  Hands-free commands via Web Speech API. Say “Hey EcoTrack” followed by your command.
                </p>
              </div>
              <AudioLines className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-200" />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {[
                'Hey EcoTrack, log 50 km car travel',
                "What's my emission today?",
                'Set goal to reduce 20% this month',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setDraft(sample)}
                  className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[10px] text-sky-100 transition hover:bg-sky-500/20"
                >
                  {sample}
                </button>
              ))}
            </div>

            {(voiceNotice || lastVoiceTranscript) && (
              <div className="mt-2 rounded-xl border border-sky-400/20 bg-surface-800/50 px-2.5 py-2 text-[11px] text-slate-200">
                {voiceNotice && <p>{voiceNotice}</p>}
                {lastVoiceTranscript && (
                  <p className="mt-1 text-slate-400">
                    Last heard: "{lastVoiceTranscript}"
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={openSmartComplaints}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <Camera className="h-3.5 w-3.5" />
              Launch Smart Complaints
            </button>
          </div>

          <div className="rounded-2xl border border-surface-500/25 bg-surface-800/50 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Goal Tracker</p>
                <p className="text-[11px] text-slate-400">Monthly reduction target with badges + weekly summaries</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                <Trophy className="h-3 w-3" />
                {goalProgress ? `Lvl ${goalProgress.gamificationLevel}` : 'Lvl -'}
              </span>
            </div>

            {goalLoading && (
              <div className="rounded-xl bg-surface-700/50 px-3 py-2 text-xs text-slate-400">
                Loading goal progress...
              </div>
            )}

            {!goalLoading && goalProgress && (
              <div className="space-y-3">
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-brand-200">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      Target: Reduce by {goalProgress.targetReductionPct}%
                    </span>
                    <span>{goalProgress.progressPct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, goalProgress.progressPct)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-300">{goalProgress.statusMessage}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-700/40 p-2">
                    <p className="text-[10px] text-slate-500">Baseline</p>
                    <p className="text-xs font-semibold text-white">{formatKg(goalProgress.baselineEmissionKg)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/40 p-2">
                    <p className="text-[10px] text-slate-500">Current</p>
                    <p className="text-xs font-semibold text-white">{formatKg(goalProgress.currentEmissionKg)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/40 p-2">
                    <p className="text-[10px] text-slate-500">Target</p>
                    <p className="text-xs font-semibold text-white">{formatKg(goalProgress.targetEmissionKg)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Milestone badges</p>
                  <div className="flex flex-wrap gap-2">
                    {goalProgress.unlockedBadges?.length > 0 ? goalProgress.unlockedBadges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-200"
                      >
                        <Medal className="h-3 w-3" />
                        {badge}
                      </span>
                    )) : (
                      <span className="rounded-full border border-surface-500/40 bg-surface-700/60 px-2.5 py-1 text-[10px] text-slate-400">
                        No badge unlocked yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {goalProgress.milestones?.slice(0, 3).map((milestone) => (
                    <div key={milestone.code} className="rounded-xl border border-surface-500/20 bg-surface-700/35 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-white">{milestone.title}</p>
                        <span className={`text-[10px] ${milestone.unlocked ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {milestone.unlocked ? 'Unlocked' : `${milestone.progressPct}%`}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">{milestone.description}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={submitGoalTarget} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                      Monthly target (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      step="1"
                      value={goalTargetDraft}
                      onChange={(event) => setGoalTargetDraft(event.target.value)}
                      className="input-field h-9"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={goalSaving}
                    className="h-9 rounded-xl border border-brand-500/30 bg-brand-500/15 px-3 text-xs font-medium text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-60"
                  >
                    {goalSaving ? 'Saving...' : 'Save'}
                  </button>
                </form>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleWeeklySummary}
                    disabled={goalSaving}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs transition ${
                      goalProgress.weeklySummaryEnabled
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-surface-500/30 bg-surface-700/40 text-slate-300'
                    }`}
                  >
                    <Mail className="mr-1 inline h-3.5 w-3.5" />
                    {goalProgress.weeklySummaryEnabled ? 'Weekly email on' : 'Weekly email off'}
                  </button>
                  <button
                    type="button"
                    onClick={sendWeeklySummaryNow}
                    disabled={summarySending}
                    className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-60"
                  >
                    {summarySending ? 'Sending...' : 'Send now'}
                  </button>
                </div>
              </div>
            )}

            {goalNotice && (
              <p className="mt-2 text-[11px] text-slate-300">{goalNotice}</p>
            )}
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl border px-3.5 py-3 ${
                  message.role === 'user'
                    ? 'border-brand-500/20 bg-brand-500/15 text-white'
                    : 'border-surface-500/20 bg-surface-700/50 text-slate-100'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>

                {message.insights?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.insights.slice(0, 3).map((insight, index) => (
                      <span
                        key={`${message.id}-insight-${index}`}
                        className="rounded-full bg-surface-900/70 px-2.5 py-1 text-[11px] text-slate-300"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/50 px-3.5 py-3 text-sm text-slate-400">
                Reviewing your profile and carbon habits...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-surface-500/20 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {followUpPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-surface-500/20 bg-surface-700/40 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-surface-700/70"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit(event)
                }
              }}
              rows={3}
              className="input-field min-h-[88px] resize-none"
              placeholder="Ask about your profile, goal progress, today's carbon choices, or this week's best action..."
            />

            <button
              type="submit"
              disabled={sending || voiceBusy || !draft.trim()}
              className="btn-primary w-full justify-center"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : voiceBusy ? 'Processing voice...' : 'Send to Copilot'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
