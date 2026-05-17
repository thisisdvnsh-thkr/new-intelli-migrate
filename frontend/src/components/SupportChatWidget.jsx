import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, GitBranch, Bot } from 'lucide-react'
import { supportChat } from '../lib/api'

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I am Intelli-Migrate Support Agent. Ask me anything about upload, agents, mapping, SQL, deploy, or account settings.'
    }
  ])
  const [githubUrl, setGithubUrl] = useState('https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues')
  const quickPrompts = [
    'How do I upload and parse?',
    'How is confidence calculated?',
    'How do I deploy to Supabase?',
    'Show my session progress'
  ]
  const listRef = useRef(null)

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

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const nextHistory = [...messages, { role: 'user', content: text }]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    try {
      const res = await supportChat(text, nextHistory.slice(-8), window.location.pathname)
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
        <div className="w-[360px] h-[520px] rounded-3xl border border-white/15 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-4 h-4 text-blue-300" />
              <p className="font-semibold text-sm">Intelli Support Agent</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="h-[400px] overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={`${m.role}-${idx}`} className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-auto bg-blue-500/20 border border-blue-500/30 text-blue-100'
                  : 'bg-white/[0.05] border border-white/10 text-white/85'
              }`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[90%] px-3 py-2 rounded-2xl text-sm bg-white/[0.05] border border-white/10 text-white/70">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2 mb-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about platform, agents, deploy..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
              />
              <button
                onClick={send}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
              <GitBranch className="w-3 h-3" />
              GitHub comments & suggestions
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
