import { useMemo, useState } from 'react'
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'
import { SectionHeader } from '../../components/ui'

function createWelcomeMessage(name) {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `I’m your carbon coach, ${name || 'there'}. Ask me how to reduce your footprint, whether you are near your zone limit, or what your biggest emission source is.`,
    insights: [],
    followUps: [
      'How do I reduce my carbon footprint?',
      'Am I close to my zone limit?',
      'What is my highest emission source?',
    ],
  }
}

export default function AiAssistant() {
  const { user } = useAuth()
  const [messages, setMessages] = useState(() => [createWelcomeMessage(user?.name)])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const followUpPrompts = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')
    return lastAssistantMessage?.followUps || []
  }, [messages])

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim()
    if (!message || sending) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      insights: [],
      followUps: [],
    }

    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setSending(true)

    try {
      const res = await userApi.chatWithAssistant(message)
      const reply = res.data

      setMessages((prev) => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: reply?.answer || 'I could not build a response right now.',
        insights: reply?.insights || [],
        followUps: reply?.followUpPrompts || [],
        riskLevel: reply?.riskLevel || 'SAFE',
      }])
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        text: error?.response?.data?.message || 'I could not reach the carbon coach right now. Please try again.',
        insights: [],
        followUps: [],
        riskLevel: 'SAFE',
      }])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await sendMessage(draft)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">AI Carbon Coach</h1>
        <p className="page-subtitle">Ask questions and get guidance based on your own emission history, zone limits, and activity patterns.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr] gap-4">
        <div className="glass-card p-5">
          <SectionHeader
            title="Chat"
            subtitle="Personalized answers from your live dashboard data"
            action={(
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                <Sparkles className="w-3.5 h-3.5" />
                Personalized
              </span>
            )}
          />

          <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-brand-600/20 text-brand-300 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl rounded-2xl border px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-500/15 border-brand-500/20 text-white'
                    : 'bg-surface-700/40 border-surface-500/20 text-slate-100'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>

                  {message.insights?.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {message.insights.map((insight, index) => (
                        <div key={`${message.id}-insight-${index}`} className="rounded-xl bg-surface-900/50 px-3 py-2 text-xs text-slate-300">
                          {insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="w-9 h-9 rounded-full bg-brand-600/20 text-brand-300 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl border border-surface-500/20 bg-surface-700/40 px-4 py-3 text-sm text-slate-400">
                  Thinking through your carbon data...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {followUpPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-surface-500/20 bg-surface-700/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-700/60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                rows={3}
                className="input-field min-h-[88px] resize-none"
                placeholder="Ask something like: How do I reduce my carbon footprint?"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="btn-primary min-w-[120px] self-end justify-center"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="What You Can Ask" subtitle="Good prompts for the assistant" />
          <div className="space-y-3">
            {[
              'How do I reduce my carbon footprint?',
              'Am I close to my zone limit this month?',
              'What is my highest emission source right now?',
              'What should I change this week?',
              'How can I reduce travel or electricity emissions?',
            ].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => sendMessage(idea)}
                className="w-full rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-left hover:bg-surface-700/50"
              >
                <p className="text-sm text-white">{idea}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
            <p className="text-sm font-semibold text-white">How this works</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              The coach uses your logged entries, current month totals, projected trend, zone range,
              and personalized recommendations already generated inside the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
