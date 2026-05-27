import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const CHAT_STORAGE_KEY = 'intelli-chat-open'

export default function IntelliChatWidget() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const isLoggedIn = Boolean(user)
  const [open, setOpen] = useState(() => localStorage.getItem(CHAT_STORAGE_KEY) === 'true')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, String(open))
  }, [open])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('open-support-chat', onOpen)
    return () => window.removeEventListener('open-support-chat', onOpen)
  }, [])

  const greeting = isLoggedIn
    ? t('chat.greeting.user').replace('{name}', user?.name || t('there'))
    : t('chat.greeting.visitor')

  const baseAssistantIntro = isLoggedIn
    ? t('chat.intro.user')
    : t('chat.intro.visitor')

  const knowledgeBase = useMemo(() => ([
    {
      id: 'getting-started',
      keywords: ['start', 'getting', 'begin', 'upload', 'file', 'first'],
      visitor: [t('Upload JSON, CSV, or XML and preview extracted structure instantly.'), t('Get Started')],
      user: [t('Upload Data'), t('Upload JSON, CSV, or XML and preview extracted structure instantly.'), t('Continue to Schema Mapping')]
    },
    {
      id: 'schema-mapping',
      keywords: ['schema', 'mapping', 'map', 'columns', 'confidence'],
      visitor: [t('Schema Mapping'), t('Agent 2 maps source fields to SQL-friendly column names.'), t('Confidence Visualizer')],
      user: [t('Schema Mapping'), t('Run Mapping'), t('Confidence Visualizer')]
    },
    {
      id: 'anomalies',
      keywords: ['anomaly', 'quality', 'issues', 'outlier'],
      visitor: [t('Anomaly Detection'), t('Agent 3 checks quality issues, outliers, and missing values.'), t('Quality Score')],
      user: [t('Anomaly Detection'), t('Run Detection'), t('Quality Score')]
    },
    {
      id: 'sql-generation',
      keywords: ['sql', 'generate', 'ddl', 'dml'],
      visitor: [t('SQL Generation'), t('Agent 4 + 5 normalize data and generate production-ready SQL.'), t('Generate SQL')],
      user: [t('SQL Generation'), t('Generate SQL'), t('Proceed to Deploy')]
    },
    {
      id: 'deployment',
      keywords: ['deploy', 'deployment', 'database', 'render', 'supabase', 'neon', 'railway'],
      visitor: [t('Deploy to Database'), t('Deploy to your selected provider'), t('Open Database Dashboard')],
      user: [t('Deploy to Database'), t('Deploy Now'), t('Open Database Dashboard')]
    },
    {
      id: 'profile-settings',
      keywords: ['profile', 'settings', 'password', 'notifications', 'theme', 'language'],
      visitor: [t('Settings'), t('User Profile'), t('Language')],
      user: [t('Settings'), t('User Profile'), t('Change Password')]
    },
    {
      id: 'password-reset',
      keywords: ['forgot', 'reset', 'password', 'login'],
      visitor: [t('Forgot password'), t('Enter your account email to receive a secure reset link.'), t('Send reset link')],
      user: [t('Change Password'), t('Use 8+ characters with a mix of letters, numbers, and symbols. Avoid reusing old passwords.')]
    },
    {
      id: 'support',
      keywords: ['support', 'help', 'contact', 'docs', 'documentation'],
      visitor: [t('Help Center'), t('Documentation'), t('Contact Support')],
      user: [t('Help Center'), t('Documentation'), t('Contact Support')]
    }
  ]), [t])

  const suggestions = isLoggedIn
    ? [t('chat.suggest.status'), t('chat.suggest.deploy'), t('chat.suggest.security')]
    : [t('chat.suggest.features'), t('chat.suggest.getting-started'), t('chat.suggest.pricing')]

  useEffect(() => {
    setMessages([
      { role: 'assistant', content: greeting },
      { role: 'assistant', content: baseAssistantIntro }
    ])
  }, [greeting, baseAssistantIntro, language, isLoggedIn])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const pickResponse = (text) => {
    const normalized = text.toLowerCase()
    let best = null
    let bestScore = 0
    knowledgeBase.forEach((entry) => {
      const score = entry.keywords.reduce((acc, keyword) => acc + (normalized.includes(keyword) ? 1 : 0), 0)
      if (score > bestScore) {
        bestScore = score
        best = entry
      }
    })
    if (!best) return [t('chat.fallback')]
    return isLoggedIn ? best.user : best.visitor
  }

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMessage = { role: 'user', content: text.trim() }
    const assistantResponse = pickResponse(text.trim())
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: 'assistant', content: assistantResponse.join(' ') }
    ])
    setInput('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[130]">
      {open ? (
        <div className="w-[360px] md:w-[420px] rounded-[28px] bg-[#0c0c10] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{t('chat.title')}</p>
                <p className="text-xs text-white/50">{t('chat.subtitle')}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-white/80'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">{t('chat.suggestions')}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/70 hover:bg-white/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/help')}
                className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/70 hover:bg-white/10 transition-colors"
              >
                {t('Help Center')}
              </button>
              <button
                onClick={() => navigate('/documentation')}
                className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/70 hover:bg-white/10 transition-colors"
              >
                {t('Documentation')}
              </button>
              <button
                onClick={() => navigate('/contact-support')}
                className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/70 hover:bg-white/10 transition-colors"
              >
                {t('Contact Support')}
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-3 bg-black/40">
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
              <textarea
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder')}
                className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none resize-none"
              />
              <button
                onClick={() => sendMessage(input)}
                className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-400 transition-colors"
                aria-label={t('chat.send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('chat.launch')}</span>
        </button>
      )}
    </div>
  )
}
