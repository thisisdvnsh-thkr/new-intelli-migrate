import { useEffect, useRef, useState } from 'react'
import { Headset, Send, X } from 'lucide-react'

const STARTER_MESSAGES = []

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
          // If the bot says it doesn't know or an error is indicated, show a helpful fallback
          const lower = data.reply.toLowerCase()
          if (lower.includes("don't know") || lower.includes('error')) {
            addMessage(
              "I'm still learning the specifics of that process. You can explore our documentation or raise an issue on our GitHub: https://github.com/thisisdvnsh-thkr/new-intelli-migrate.git",
              'bot'
            )
          } else {
            addMessage(data.reply, 'bot')
          }
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
        <div className="fixed bottom-6 right-6 z-[120]">
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white text-black shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all"
            aria-label="Open live support"
          >
            <Headset className="w-6 h-6" />
          </button>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Live Support
          </div>
        </div>
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

          {/* Quick action buttons */}
          <div className="px-4 py-2 flex gap-2">
            <button
              onClick={() => handleStarterClick("I can't log in")}
              className="flex-1 rounded-full bg-blue-600 text-white py-2 hover:bg-blue-700 transition"
            >
              I can't log in
            </button>
            <button
              onClick={() => handleStarterClick("I want to learn about IntelliMigrate")}
              className="flex-1 rounded-full bg-purple-600 text-white py-2 hover:bg-purple-700 transition"
            >
              I want to learn about IntelliMigrate
            </button>
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
  // expose global toggle function
  useEffect(() => {
    window.toggleIntelliChat = () => setOpen((prev) => !prev)
  }, [])
}
