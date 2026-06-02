import { useEffect, useRef, useState } from 'react'
import { Headset, Send, X, ThumbsUp, ThumbsDown, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* -------------------------------------------------------------------------- */
/*  Constants & Helper UI                                                   */
/* -------------------------------------------------------------------------- */
const QUICK_ACTIONS = [
  'How does migration work?',
  'Supported databases',
  'Security & compliance',
  'Pricing information',
  'Generate SQL automatically?',
  'Book a demo',
]

// GitHub repo for “Report Issue” – replace with your actual repo URL if needed
const GITHUB_ISSUES_URL = 'https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues/new?title='

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
/*  Main Component                                                          */
/* -------------------------------------------------------------------------- */
export default function IntelliChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // {id, role, text, ts, feedback}
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const listRef = useRef(null)

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

  /* ------------------------------------------------------------------------ */
  /*  Helper: add a message to the conversation                                 */
  /* ------------------------------------------------------------------------ */
  const addMessage = (text, role = 'user') => {
    const newMsg = {
      id: `${Date.now()}-${messages.length}`,
      role,
      text,
      ts: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])
    return newMsg.id
  }

  /* ------------------------------------------------------------------------ */
  /*  Send a question to the backend                                            */
  /* ------------------------------------------------------------------------ */
  const submitQuestion = (question) => {
    // Add user message
    addMessage(question, 'user')
    setIsTyping(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000) // safety net

    fetch('/api/support-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        const reply = data?.reply?.trim()
        if (!reply) {
          // ---- SMART FALLBACK -------------------------------------------------
          addMessage(
            "I couldn't find a reliable answer.",
            'bot'
          )
          // Show fallback actions as a bot message (they will be rendered as chips)
          addMessage(
            JSON.stringify({
              fallback: true,
              actions: [
                'Give Feedback',
                'Contact Support',
                'Open GitHub Issues',
                'Request Feature',
              ],
            }),
            'bot'
          )
        } else {
          // Normal reply – we simulate streaming by showing the whole text at once
          addMessage(reply, 'bot')
        }
      })
      .catch(() => {
        clearTimeout(timeoutId)
        addMessage(
          "I couldn't find a reliable answer.",
          'bot'
        )
        addMessage(
          JSON.stringify({
            fallback: true,
            actions: [
              'Give Feedback',
              'Contact Support',
              'Open GitHub Issues',
              'Request Feature',
            ],
          }),
          'bot'
        )
      })
      .finally(() => setIsTyping(false))
  }

  /* ------------------------------------------------------------------------ */
  /*  UI Handlers                                                               */
  /* ------------------------------------------------------------------------ */
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
    // rating: 'up' | 'down'
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: rating } : m
      )
    )
    if (rating === 'down') {
      // Prompt for more details
      const detail = window.prompt('Sorry about that! What went wrong?')
      if (detail) {
        // Store locally – you can later send to a backend endpoint if it exists
        const stored = JSON.parse(localStorage.getItem('chat_feedback') || '[]')
        stored.push({ messageId: msgId, rating, detail, ts: new Date().toISOString() })
        localStorage.setItem('chat_feedback', JSON.stringify(stored))
      }
    }
  }

  const openGitHubIssue = () => {
    const title = encodeURIComponent('AI Assistant – Unable to answer user query')
    const body = encodeURIComponent(
      `**Describe the issue**\n\nI asked a question and the AI assistant could not provide a satisfactory answer.\n\n**Question**\n${messages
        .filter((m) => m.role === 'user')
        .slice(-1)[0]?.text || ''}\n\n**Assistant reply**\n${messages
        .filter((m) => m.role === 'bot')
        .slice(-1)[0]?.text || ''}`
    )
    window.open(`${GITHUB_ISSUES_URL}${title}&body=${body}`, '_blank')
  }

  /* ------------------------------------------------------------------------ */
  /*  Render helpers                                                            */
  /* ------------------------------------------------------------------------ */
  const renderWelcome = () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Welcome to Intelli-Migrate AI Assistant
      </h2>
      <p className="text-sm text-slate-300">
        I can answer questions about migration workflows, supported databases,
        pricing, security, SQL generation, and troubleshooting.
      </p>
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
    // Detect if this is a fallback action payload
    let isFallback = false
    let fallbackActions = []
    if (msg.role === 'bot') {
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
        className={`flex ${
          msg.role === 'user' ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] break-words ${
            msg.role === 'user'
              ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
              : 'bg-white/5 text-white/80 border border-white/10'
          }`}
        >
          {/* Regular text */}
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

          {/* Timestamp */}
          <div className="mt-1 text-xs text-white/40">
            {new Date(msg.ts).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Feedback (only for bot messages that are not fallback) */}
          {msg.role === 'bot' && !isFallback && (
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

  /* ------------------------------------------------------------------------ */
  /*  Main JSX                                                                */
  /* ------------------------------------------------------------------------ */
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
                <p className="text-xs text-white/60">
                  We reply in seconds
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message list */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {/* If no messages yet – show welcome screen */}
              {messages.length === 0 && !isTyping && renderWelcome()}

              {/* Conversation */}
              <AnimatePresence>
                {messages.map((msg, idx) => renderMessage(msg, idx))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex">
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/80 border border-white/10 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions (only when no conversation yet) */}
            {messages.length === 0 && !isTyping && (
              <div className="px-4 py-2 border-t border-white/10 bg-white/5">
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
            )}

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
