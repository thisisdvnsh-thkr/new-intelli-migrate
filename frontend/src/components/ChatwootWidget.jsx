import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const CHATWOOT_ACCOUNT_ID = '167571'
const CHATWOOT_INBOX_ID = 'SAKUQcpLsDjuKrTLbjztiEhN'
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com'

export default function ChatwootWidget() {
  const { user } = useAuth()
  const pendingOpenRef = useRef(false)

  useEffect(() => {
    const init = () => {
      if (!window.chatwootSDK) return
      window.chatwootSDK.run({
        websiteToken: CHATWOOT_INBOX_ID,
        baseUrl: CHATWOOT_BASE_URL
      })
      if (pendingOpenRef.current && window.$chatwoot) {
        window.$chatwoot.toggle('open')
        pendingOpenRef.current = false
      }
    }

    if (!window.chatwootSDK) {
      const script = document.createElement('script')
      script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`
      script.async = true
      document.body.appendChild(script)
      script.onload = init
    } else {
      init()
    }
  }, [])

  useEffect(() => {
    if (!window.$chatwoot || !user?.email) return
    window.$chatwoot.setUser(user.email, {
      name: user.name || 'User',
      email: user.email,
      avatar_url: user.avatar || undefined,
      phone_number: user.phone || undefined,
      user_id: String(user.id)
    })
  }, [user])

  useEffect(() => {
    const handleOpen = () => {
      if (window.$chatwoot) {
        window.$chatwoot.toggle('open')
        return
      }
      pendingOpenRef.current = true
    }
    window.addEventListener('open-support-chat', handleOpen)
    return () => window.removeEventListener('open-support-chat', handleOpen)
  }, [])

  return null
}
