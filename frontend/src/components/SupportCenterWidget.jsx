import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HelpCircle, MessageSquare, Search, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const faqContent = {
  en: [
    {
      id: 'reset-password',
      question: 'How do I reset my password?',
      answer: 'Go to Login → Forgot Password. We will email a reset link that expires in 30 minutes.'
    },
    {
      id: 'deploy-steps',
      question: 'What are the full migration steps?',
      answer: 'Upload → Schema Map → Anomalies → Generate SQL → Deploy. Tell me which step you are on.'
    },
    {
      id: 'quality-score',
      question: 'How is quality score calculated?',
      answer: 'Quality score reflects clean-record percentage after anomaly detection and data checks.'
    },
    {
      id: 'provider-keys',
      question: 'Where do I add provider keys?',
      answer: 'Open Profile → Database Connection. Save provider API key, project ID, and database URL.'
    },
    {
      id: 'session-history',
      question: 'Where are my sessions saved?',
      answer: 'Sessions appear in the sidebar and can be reopened anytime from the Dashboard.'
    },
    {
      id: 'support-email',
      question: 'How do I contact support?',
      answer: 'Use live chat or open Help Center for guided articles and setup steps.'
    }
  ],
  hi: [
    {
      id: 'reset-password',
      question: 'पासवर्ड रीसेट कैसे करें?',
      answer: 'लॉगिन → Forgot Password पर जाएँ। ईमेल में रीसेट लिंक मिलेगा जो 30 मिनट में समाप्त हो जाता है।'
    },
    {
      id: 'deploy-steps',
      question: 'पूरी माइग्रेशन प्रक्रिया क्या है?',
      answer: 'Upload → Schema Map → Anomalies → Generate SQL → Deploy. बताइए आप किस स्टेप पर हैं।'
    },
    {
      id: 'quality-score',
      question: 'क्वालिटी स्कोर कैसे बनता है?',
      answer: 'एनॉमली डिटेक्शन के बाद साफ रिकॉर्ड प्रतिशत के आधार पर क्वालिटी स्कोर तय होता है।'
    },
    {
      id: 'provider-keys',
      question: 'प्रोवाइडर कीज़ कहाँ जोड़ें?',
      answer: 'Profile → Database Connection में API key, Project ID और DB URL सेव करें।'
    },
    {
      id: 'session-history',
      question: 'सेशन्स कहाँ सेव होते हैं?',
      answer: 'सेशन्स साइडबार में दिखते हैं और डैशबोर्ड से फिर से खोले जा सकते हैं।'
    },
    {
      id: 'support-email',
      question: 'सपोर्ट से कैसे संपर्क करें?',
      answer: 'लाइव चैट खोलें या Help Center में गाइडेड आर्टिकल देखें।'
    }
  ]
}

export default function SupportCenterWidget() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('home')
  const [search, setSearch] = useState('')
  const [answered, setAnswered] = useState([])
  const [activeAnswer, setActiveAnswer] = useState(null)

  const questions = useMemo(() => {
    const items = faqContent[language] || faqContent.en
    const trimmed = search.trim().toLowerCase()
    return items.filter((item) => {
      if (answered.includes(item.id)) return false
      if (!trimmed) return true
      return item.question.toLowerCase().includes(trimmed)
    })
  }, [language, search, answered])

  const handleQuestion = (item) => {
    setActiveAnswer(item)
    setAnswered((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]))
  }

  const openChat = () => {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize()
    }
    setTab('messages')
  }

  return (
    <div className="fixed bottom-5 right-5 z-[95]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform"
          title={t('help_center')}
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-[360px] h-[640px] rounded-[28px] overflow-hidden shadow-2xl border border-white/10 bg-[#0b1220]">
          <div className="relative h-40 bg-gradient-to-br from-[#1557b0] via-[#12418c] to-[#0d2f64] p-5 text-white">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-white/70 text-sm mb-2">Intelli-Migrate</p>
            <p className="text-2xl font-semibold leading-tight">
              {t('support_title')}
            </p>
            <p className="text-white/70 text-sm mt-2">
              {user?.full_name ? `Hey ${user.full_name.split(' ')[0]} 👋` : 'We are here to help.'}
            </p>
          </div>

          <div className="px-4 -mt-6">
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('support_search')}
                className="w-full text-sm text-gray-700 outline-none"
              />
            </div>
          </div>

          <div className="h-[396px] overflow-y-auto px-4 pb-4 pt-6 space-y-4">
            {tab === 'home' && (
              <>
                {activeAnswer ? (
                  <div className="bg-white rounded-2xl p-4 text-sm text-gray-700 shadow">
                    <p className="text-xs uppercase text-gray-400 mb-2">{t('support_answer')}</p>
                    <p className="font-semibold text-gray-900 mb-2">{activeAnswer.question}</p>
                    <p>{activeAnswer.answer}</p>
                    <button
                      className="mt-3 text-blue-600 text-xs font-semibold"
                      onClick={() => setActiveAnswer(null)}
                    >
                      {t('support_back')}
                    </button>
                  </div>
                ) : (
                  questions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuestion(item)}
                      className="w-full text-left bg-white rounded-2xl p-4 shadow hover:shadow-lg transition-shadow"
                    >
                      <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.answer}</p>
                    </button>
                  ))
                )}
                {questions.length === 0 && !activeAnswer && (
                  <div className="text-sm text-white/60 text-center">No more questions.</div>
                )}
              </>
            )}

            {tab === 'messages' && (
              <div className="bg-white rounded-2xl p-4 text-sm text-gray-700 shadow">
                <p className="font-semibold text-gray-900 mb-2">Live chat is ready.</p>
                <p className="text-gray-500">Tap below to start a live conversation with support.</p>
                <button
                  onClick={openChat}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('support_open_chat')}
                </button>
              </div>
            )}

            {tab === 'help' && (
              <div className="bg-white rounded-2xl p-4 text-sm text-gray-700 shadow space-y-3">
                <p className="font-semibold text-gray-900">Help Center</p>
                <p className="text-gray-500">Browse guides, onboarding, and deployment help.</p>
                <button
                  onClick={() => navigate('/help')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
                >
                  {t('support_help_link')}
                </button>
                <Link to="/documentation" className="block text-blue-600 text-sm font-semibold">
                  Documentation →
                </Link>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#0b1220] px-4 py-3">
            <div className="grid grid-cols-3 text-xs text-white/70">
              {[
                { id: 'home', label: t('support_home') },
                { id: 'messages', label: t('support_messages') },
                { id: 'help', label: t('support_help') }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`py-2 rounded-xl ${tab === item.id ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
