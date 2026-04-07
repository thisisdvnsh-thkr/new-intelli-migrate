import axios from 'axios'

// Backend API URL - use Render in production
const API_BASE = 'https://new-intelli-migrate.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// Get agents status
export const getAgentsStatus = async () => {
  const response = await api.get('/agents/status')
  return response.data
}

// Step 1: Upload file
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / e.total)
      onProgress?.(percent)
    }
  })
  return response.data
}

// Step 2: Map schema
export const mapSchema = async (sessionId, domain = 'ecommerce') => {
  const response = await api.post(`/map-schema/${sessionId}?domain=${domain}`)
  return response.data
}

// Step 3: Detect anomalies
export const detectAnomalies = async (sessionId) => {
  const response = await api.post(`/detect-anomalies/${sessionId}`)
  return response.data
}

// Step 4: Normalize data
export const normalizeData = async (sessionId) => {
  const response = await api.post(`/normalize/${sessionId}`)
  return response.data
}

// Step 5: Generate SQL
export const generateSQL = async (sessionId, dialect = 'postgresql') => {
  const response = await api.post(`/generate-sql/${sessionId}?dialect=${dialect}`)
  return response.data
}

// Step 6: Deploy to Supabase
export const deployToSupabase = async (sessionId, supabaseUrl, supabaseKey) => {
  const response = await api.post(`/deploy/${sessionId}`, {
    supabase_url: supabaseUrl,
    supabase_key: supabaseKey
  })
  return response.data
}

// Download SQL file
export const downloadSQL = async (sessionId) => {
  const response = await api.get(`/download-sql/${sessionId}`, {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `migration_${sessionId}.sql`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api
