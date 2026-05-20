import { useEffect } from 'react'

const TAWK_PROPERTY_ID = '6a0d99faf2730b1c34e2400f'
const TAWK_WIDGET_ID = '1jp2i2vk1'

export default function TawkChatWidget() {
  useEffect(() => {
    if (document.getElementById('tawk-script')) return
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    const s1 = document.createElement('script')
    s1.id = 'tawk-script'
    s1.async = true
    s1.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    document.body.appendChild(s1)
  }, [])

  return null
}
