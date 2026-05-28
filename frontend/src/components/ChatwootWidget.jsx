import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const CHATWOOT_ACCOUNT_ID = '167571'
const CHATWOOT_INBOX_ID = 'SAKUQcpLsDjuKrTLbjztiEhN'
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com'

export default function ChatwootWidget() {
  const { user } = useAuth()

  useEffect(() => {
    // Load Chatwoot script
    if (window.chatwootSDK) return

    const script = document.createElement('script')
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.chatwootSDK) {
        window.chatwootSDK.run({
          websiteToken: CHATWOOT_INBOX_ID,
          baseUrl: CHATWOOT_BASE_URL
        })

        // Pre-populate user info if logged in
        if (user?.email) {
          window.$chatwoot.setUser(user.email, {
            name: user.name || 'User',
            email: user.email,
            avatar_url: user.avatar || undefined,
            phone_number: user.phone || undefined,
            user_id: String(user.id)
          })
        }
      }
    }

    return () => {
      // Cleanup if needed
    }
  }, [user])

  return null
}
