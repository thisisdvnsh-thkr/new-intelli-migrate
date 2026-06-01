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
