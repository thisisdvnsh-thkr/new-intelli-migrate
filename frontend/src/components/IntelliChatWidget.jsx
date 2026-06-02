import { useEffect, useRef, useState } from 'react'
import {
  Headset,
  Send,
  X,
  ThumbsUp,
  ThumbsDown,
  Search,
  BookOpen,
  ArrowRight,
  LogOut,
  Database,
  Phone,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* -------------------------------------------------------------------------- */
/*  Static data – FAQ, Knowledge Base, Categories, Quick Actions              */
/* -------------------------------------------------------------------------- */
const CATEGORIES = [
  { id: 'login', label: 'Login Issues', icon: LogOut },
  { id: 'migration', label: 'Database Migration', icon: Database },
  { id: 'deployment', label: 'Deployment', icon: ArrowRight },
  { id: 'integrations', label: 'Integrations', icon: Phone },
]

const QUICK_ACTIONS = [
  'How does migration work?',
  'Supported databases',
  'Security & compliance',
  'Pricing information',
  'Generate SQL automatically?',
  'Book a demo',
]

const FAQ_CARDS = [
  {
    title: 'What is Intelli‑Migrate?',
    description:
      'A SaaS platform that converts unstructured data into relational schemas using AI.',
  },
  {
    title: 'Supported source formats',
    description:
      'JSON, CSV, XML and nested structures up to 10 levels deep.',
  },
  {
    title: 'How is data secured?',
    description:
      'All data is encrypted at rest and in transit, and we never store raw files longer than 24 h.',
  },
]

const KNOWLEDGE_BASE = [
  {
    title: 'Step‑by‑step migration guide',
    url: 'https://intelli-migrate.com/docs/migration-guide',
  },
  {
    title: 'Pricing & plans',
    url: 'https://intelli-migrate.com/pricing',
  },
  {
    title: 'Integrating with Supabase',
    url: 'https://intelli-migrate.com/docs/supabase-integration',
  },
]

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                       */
/* -------------------------------------------------------------------------- */
const containerVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
}

/* -------------------------------------------------------------------------- */
/*  Helper components                                                       */
/* -------------------------------------------------------------------------- */
function TypingDots() {
  return (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                          */
/* -------------------------------------------------------------------------- */
export default function IntelliChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // {id, role, text, ts, feedback, suggestions, articles, confidence}
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [category, setCategory] = useState(CATEGORIES[0].id)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketDetails, setTicketDetails] = useState({ subject: '', description: '' })
  const listRef = useRef(null)

  /* ---------------------------------------------------------------------- */
  /*  Load / persist conversation history                                    */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem('intelli_chat_history')
    if (stored) {
      try {
        setMessages(JSON.parse(stored))
      } catch {
        // ignore corrupted data
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('intelli_chat_history', JSON.stringify(messages))
  }, [messages])

  // Auto‑scroll to bottom when new messages appear
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  // Global toggle for external scripts (kept for backward compatibility)
  useEffect(() => {
    window.toggleIntelliChat = () => setOpen((prev) => !prev)
  }, [])

  /* ---------------------------------------------------------------------- */
  /*  Helper: add a message to the conversation                               */
  /* ---------------------------------------------------------------------- */
  const addMessage = (payload) => {
    const base = {
      id: `${Date.now()}-${messages.length}`,
      ts: new Date().toISOString(),
    }
    const newMsg = { ...base, ...payload }
    setMessages((prev) => [...prev, newMsg])
    return newMsg.id
  }

  /* ---------------------------------------------------------------------- */
  /*  Send a question to the backend                                          */
  /* ---------------------------------------------------------------------- */
  const submitQuestion = (question) => {
    // User message
    addMessage({ role: 'user', text: question })
    setIsTyping(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    fetch('/api/support-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, category }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        const reply = data?.reply?.trim() || ''
        const confidence =
          typeof data?.confidence === 'number' ? data.confidence : 1
        const suggestions = Array.isArray(data?.suggestions)
          ? data.suggestions
          : []
        const articles = Array.isArray(data?.articles) ? data.articles : []

        // Bot reply
        addMessage({
          role: 'bot',
          text: reply || "I couldn't find a reliable answer.",
          confidence,
          suggestions,
          articles,
        })

        // Low confidence → show ticket form
        if (confidence < 0.5) {
          setShowTicketForm(true)
        }
      })
      .catch(() => {
        clearTimeout(timeoutId)
        addMessage({
          role: 'bot',
          text: "I couldn't find a reliable answer.",
          confidence: 0,
          suggestions: [],
          articles: [],
        })
        setShowTicketForm(true)
      })
      .finally(() => setIsTyping(false))
  }

  /* ---------------------------------------------------------------------- */
  /*  UI Handlers                                                            */
  /* ---------------------------------------------------------------------- */
  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    submitQuestion(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChipClick = (text) => {
    submitQuestion(text)
  }

  const handleFeedback = (msgId, rating) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: rating } : m))
    )
    if (rating === 'down') {
      const detail = window.prompt('Sorry about that! What went wrong?')
      if (detail) {
        const stored = JSON.parse(localStorage.getItem('chat_feedback') || '[]')
        stored.push({
          messageId: msgId,
          rating,
          detail,
          ts: new Date().toISOString(),
        })
        localStorage.setItem('chat_feedback', JSON.stringify(stored))
      }
    }
  }

  const openGitHubIssue = () => {
    const title = encodeURIComponent(
      'AI Assistant – Unable to answer user query'
    )
    const body = encodeURIComponent(
      `**Describe the issue**\n\nI asked a question and the AI assistant could not provide a satisfactory answer.\n\n**Question**\n${messages
        .filter((m) => m.role === 'user')
        .slice(-1)[0]?.text || ''}\n\n**Assistant reply**\n${messages
        .filter((m) => m.role === 'bot')
        .slice(-1)[0]?.text || ''}`
    )
    const url = `https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues/new?title=${title}&body=${body}`
    window.open(url, '_blank')
  }

  const submitTicket = (e) => {
    e.preventDefault()
    // Placeholder – in a real product you would POST to a ticketing endpoint
    console.log('Ticket submitted', ticketDetails)
    alert('Your ticket has been submitted. Our team will get back to you shortly.')
    setTicketDetails({ subject: '', description: '' })
    setShowTicketForm(false)
  }

  /* ---------------------------------------------------------------------- */
  /*  Render helpers                                                          */
  /* ---------------------------------------------------------------------- */
  const renderWelcome = () => (
    <div className="p-4 space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search help…"
          className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none"
        />
      </div>

      {/* FAQ cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FAQ_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => handleChipClick(card.title)}
            className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <h4 className="font-medium text-white">{card.title}</h4>
            <p className="text-sm text-white/60">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )

  const renderMessage = (msg, idx) => {
    const isBot = msg.role === 'bot'
    const isUser = msg.role === 'user'

    // Detect legacy fallback payload
    let isFallback = false
    let fallbackActions = []
    if (isBot) {
      try {
        const parsed = JSON.parse(msg.text)
        if (parsed.fallback) {
          isFallback = true
          fallbackActions = parsed.actions || []
        }
      } catch {}
    }

    return (
      <motion.div
        key={msg.id}
        custom={idx}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] break-words ${
            isUser
              ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
              : 'bg-white/5 text-white/80 border border-white/10'
          }`}
        >
          {/* Normal text */}
          {!isFallback && <span>{msg.text}</span>}

          {/* Fallback actions */}
          {isFallback && (
            <div className="flex flex-col gap-2 mt-2">
              {fallbackActions.map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    if (action === 'Open GitHub Issues') openGitHubIssue()
                    else alert(`${action} – not implemented yet.`)
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Suggested follow‑up questions */}
          {isBot && msg.suggestions?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {msg.suggestions.map((sugg) => (
                <button
                  key={sugg}
                  onClick={() => handleChipClick(sugg)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition"
                >
                  {sugg}
                </button>
              ))}
            </div>
          )}

          {/* Knowledge‑base article cards */}
          {isBot && msg.articles?.length > 0 && (
            <div className="mt-2 space-y-2">
              {msg.articles.map((art) => (
                <a
                  key={art.title}
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white">{art.title}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-1 text-xs text-white/40">
            {new Date(msg.ts).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Feedback (only for bot messages that are not fallback) */}
          {isBot && !isFallback && (
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => handleFeedback(msg.id, 'up')}
                className={`p-0.5 rounded ${
                  msg.feedback === 'up' ? 'bg-white/20' : ''
                }`}
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-3 h-3 text-white/70" />
              </button>
              <button
                onClick={() => handleFeedback(msg.id, 'down')}
                className={`p-0.5 rounded ${
                  msg.feedback === 'down' ? 'bg-white/20' : ''
                }`}
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-3 h-3 text-white/70" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderCategorySelector = () => (
    <div className="flex overflow-x-auto gap-2 px-2 py-2">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const selected = category === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
              selected
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </button>
        )
      })}
    </div>
  )

  const renderTicketForm = () => (
    <form onSubmit={submitTicket} className="p-4 space-y-4 bg-white/5 rounded-xl">
      <h3 className="text-sm font-medium text-white">Submit a support ticket</h3>
      <input
        type="text"
        placeholder="Subject"
        value={ticketDetails.subject}
        onChange={(e) =>
          setTicketDetails({ ...ticketDetails, subject: e.target.value })
        }
        required
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none"
      />
      <textarea
        placeholder="Describe your issue…"
        rows={3}
        value={ticketDetails.description}
        onChange={(e) =>
          setTicketDetails({ ...ticketDetails, description: e.target.value })
        }
        required
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowTicketForm(false)}
          className="px-4 py-1 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </div>
    </form>
  )

  /* ---------------------------------------------------------------------- */
  /*  Main JSX                                                              */
  /* ---------------------------------------------------------------------- */
  return (
    <>
      {/* Closed state – floating round launcher */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-[120]">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/90 text-black shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Open AI assistant"
          >
            <Headset className="w-6 h-6" />
          </button>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            AI Assistant
          </div>
        </div>
      )}

      {/* Open state – glassmorphic chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-6 right-6 z-[120] w-[380px] max-w-[95vw] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
              <div>
                <p className="text-sm font-semibold text-white">
                  Intelli Support
                </p>
                <p className="text-xs text-white/60">We reply in seconds</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category selector */}
            {renderCategorySelector()}

            {/* Message list */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {/* Welcome screen */}
              {messages.length === 0 && !isTyping && renderWelcome()}

              {/* Conversation */}
              <AnimatePresence>
                {messages.map((msg, idx) => renderMessage(msg, idx))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex">
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/80 border border-white/10 flex items-center gap-2">
                    <TypingDots />
                    <span className="ml-2">Thinking…</span>
                  </div>
                </div>
              )}

              {/* Support ticket form (low confidence) */}
              {showTicketForm && renderTicketForm()}
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/30">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  className="rounded-full bg-white text-black p-2 hover:bg-white/90 transition-colors disabled:opacity-50"
                  aria-label="Send message"
                  disabled={isTyping || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
