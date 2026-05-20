import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)
const LANGUAGE_KEY = 'intelli-language'

const translations = {
  en: {
    workspace_controls: 'Workspace controls',
    dark_mode: 'Dark Mode',
    language: 'Language',
    product: 'Product',
    platform: 'Platform',
    resources: 'Resources',
    company: 'Company',
    account: 'Account',
    dashboard: 'Dashboard',
    new_migration: 'New Migration',
    sql_generator: 'SQL Generator',
    schema_map: 'Schema Map',
    anomalies: 'Anomalies',
    deploy: 'Deploy',
    documentation: 'Documentation',
    help_center: 'Help Center',
    contact_support: 'Contact Support',
    terms: 'Terms',
    privacy: 'Privacy',
    profile: 'Profile',
    settings: 'Settings',
    session_workspace: 'Session Workspace',
    sessions: 'Sessions',
    search_sessions: 'Search sessions',
    no_sessions: 'No sessions found.',
    open_sidebar: 'Open sidebar',
    close_sidebar: 'Close sidebar',
    support_title: 'How can we help?',
    support_search: 'Search for help',
    support_home: 'Home',
    support_messages: 'Messages',
    support_help: 'Help',
    support_open_chat: 'Start live chat',
    support_help_link: 'Open Help Center',
    support_answer: 'Answer',
    support_back: 'Back to questions'
  },
  hi: {
    workspace_controls: 'वर्कस्पेस कंट्रोल',
    dark_mode: 'डार्क मोड',
    language: 'भाषा',
    product: 'प्रोडक्ट',
    platform: 'प्लेटफ़ॉर्म',
    resources: 'संसाधन',
    company: 'कंपनी',
    account: 'अकाउंट',
    dashboard: 'डैशबोर्ड',
    new_migration: 'नया माइग्रेशन',
    sql_generator: 'SQL जेनरेटर',
    schema_map: 'स्कीमा मैप',
    anomalies: 'एनॉमलीज़',
    deploy: 'डिप्लॉय',
    documentation: 'डॉक्यूमेंटेशन',
    help_center: 'हेल्प सेंटर',
    contact_support: 'सपोर्ट से संपर्क करें',
    terms: 'नियम',
    privacy: 'प्राइवेसी',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    session_workspace: 'सेशन वर्कस्पेस',
    sessions: 'सेशन्स',
    search_sessions: 'सेशन खोजें',
    no_sessions: 'कोई सेशन नहीं मिला।',
    open_sidebar: 'साइडबार खोलें',
    close_sidebar: 'साइडबार बंद करें',
    support_title: 'हम कैसे मदद करें?',
    support_search: 'हेल्प खोजें',
    support_home: 'होम',
    support_messages: 'मैसेजेस',
    support_help: 'मदद',
    support_open_chat: 'लाइव चैट शुरू करें',
    support_help_link: 'हेल्प सेंटर खोलें',
    support_answer: 'उत्तर',
    support_back: 'सवालों पर वापस जाएँ'
  }
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' }
]

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    return stored && translations[stored] ? stored : 'en'
  })

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
    document.documentElement.setAttribute('lang', language)
  }, [language])

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    languageOptions,
    t
  }), [language, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
