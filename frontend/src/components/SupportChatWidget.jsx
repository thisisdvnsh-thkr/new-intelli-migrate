import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, GitBranch, Bot } from 'lucide-react'
import { supportChat } from '../lib/api'

const guidedOptions = [
  { id: 'track', label: 'Track my migration', prompt: 'Show my session progress and what I should do next.' },
  { id: 'confidence', label: 'Confidence explained', prompt: 'Explain mapping confidence in simple terms with examples.' },
  { id: 'anomalies', label: 'Quality score help', prompt: 'How is quality score calculated after anomaly detection?' },
  { id: 'deploy', label: 'Deploy support', prompt: 'Help me deploy with my saved database credentials.' },
  { id: 'auth', label: 'Account and password', prompt: 'How can I reset password and keep my account secure?' },
  { id: 'something_else', label: 'Something else', prompt: '' }
]

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I am Intelli-Migrate Support Agent. Choose a support topic below or type your own question.'
    }
  ])
  const [githubUrl, setGithubUrl] = useState('https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const openHandler = () => setOpen(true)
    window.addEventListener('open-support-chat', openHandler)
    return () => window.removeEventListener('open-support-chat', openHandler)
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  const send = async (rawInput = null) => {
    const text = (rawInput ?? input).trim()
    if (!text || loading) return
    const nextHistory = [...messages, { role: 'user', content: text }]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    try {
      const res = await supportChat(text, nextHistory.slice(-10), window.location.pathname)
      setGithubUrl(res.github_support_url || githubUrl)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer || 'No answer available.' }
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I could not reach support AI right now. Please use GitHub support: ${githubUrl}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleGuidedOption = (option) => {
    if (option.id === 'something_else') {
      setInput('')
      inputRef.current?.focus()
      return
    }
    send(option.prompt)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
          title="Open Intelli-Migrate Support Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-[370px] h-[560px] rounded-3xl border border-white/15 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-4 h-4 text-blue-300" />
              <p className="font-semibold text-sm">Intelli Support Agent</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="h-[360px] overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={`${m.role}-${idx}`} className={`max-w-[92%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-auto bg-blue-500/20 border border-blue-500/30 text-blue-100'
                  : 'bg-white/[0.05] border border-white/10 text-white/85'
              }`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[92%] px-3 py-2 rounded-2xl text-sm bg-white/[0.05] border border-white/10 text-white/70">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">How can we help today?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {guidedOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleGuidedOption(option)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${
                    option.id === 'something_else'
                      ? 'bg-purple-500/12 border-purple-400/35 text-purple-200'
                      : 'bg-white/[0.05] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
              <GitBranch className="w-3 h-3" />
              Contact support on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
