import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

const STARTER_MESSAGES = [
  { id: 'welcome', role: 'bot', text: 'Hi! How can we help you with your migration today?' }
]

export default function IntelliChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.text === trimmed) return prev
      return [...prev, { id: `${Date.now()}-${prev.length}`, role: 'user', text: trimmed }]
    })
    setInput('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  // ----- Starter questions (displayed at the top of the messages area) -----
  const STARTER_QUESTIONS = [
    "How does IntelliMigrate prevent schema mapping data loss?",
    "What database providers are currently supported?",
    "How does the Anomaly Detector agent flag structure drift?"
  ]

  // Helper to add a message to the local history state
  const addMessage = (text, role = 'user') => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role, text }
    ])
  }

  // Click handler for starter‑question bubbles
  const handleStarterClick = (question) => {
    // Immediately show the question in the UI
    addMessage(question, 'user')
    // Send the question to the backend with a strict 4‑second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    fetch('/api/support-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        if (data?.reply) {
          addMessage(data.reply, 'bot')
        }
      })
      .catch(() => {
        clearTimeout(timeoutId)
        const fallback =
          "Our multi‑agent schema parser safeguards data by extracting raw schemas, mapping fields with AI, detecting drift, normalising to 3NF, and generating safe migration scripts."
        addMessage(fallback, 'system')
      })
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.25)] hover:shadow-[0_22px_50px_rgba(99,102,241,0.3)] transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Chat</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[120] w-[340px] max-w-[90vw] rounded-3xl border border-white/10 bg-[#0b0b10] shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
            <div>
              <p className="text-sm font-semibold text-white">Intelli Support</p>
              <p className="text-xs text-white/60">We reply in seconds</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Starter question bubbles */}
          <div className="px-4 py-2 flex flex-col gap-2">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleStarterClick(q)}
                className="text-left bg-white/10 text-white px-3 py-2 rounded-md hover:bg-white/20 transition"
              >
                {q}
              </button>
            ))}
          </div>

          <div ref={listRef} className="max-h-[320px] overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                      : 'bg-white/5 text-white/80 border border-white/10'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-black/60">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="rounded-full bg-white text-black p-2 hover:bg-white/90 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
