import axios from 'axios'

// Backend API URL - use Render in production
const API_BASE = import.meta.env.VITE_API_BASE || 'https://new-intelli-migrate.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

// Attach token if present
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete api.defaults.headers.common['Authorization']
}

// Auth
export const signup = async (email, password, full_name) => {
  const response = await api.post('/auth/signup', { email, password, full_name })
  return response.data
}

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

// Account management
export const changePassword = async (old_password, new_password) => {
  const response = await api.post('/auth/change-password', { old_password, new_password })
  return response.data
}

export const deleteAccount = async () => {
  const response = await api.delete('/auth/delete')
  return response.data
}

// User settings
export const getUserSettings = async () => {
  const response = await api.get('/api/user/settings')
  return response.data
}

export const saveUserSettings = async (settings) => {
  const response = await api.put('/api/user/settings', { settings })
  return response.data
}

// Migration pipeline
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / e.total)
      onProgress?.(percent)
    }
  })
  return response.data
}

export const mapSchema = async (sessionId, domain = 'ecommerce') => {
  const response = await api.post(`/api/map-schema/${sessionId}?domain=${domain}`)
  return response.data
}

export const detectAnomalies = async (sessionId) => {
  const response = await api.post(`/api/detect-anomalies/${sessionId}`)
  return response.data
}

export const normalizeData = async (sessionId) => {
  const response = await api.post(`/api/normalize/${sessionId}`)
  return response.data
}

export const generateSQL = async (sessionId, dialect = 'postgresql') => {
  const response = await api.post(`/api/generate-sql/${sessionId}?dialect=${dialect}`)
  return response.data
}

export const deployToPostgres = async (sessionId, db_password) => {
  const response = await api.post(`/api/deploy/${sessionId}`, { db_password })
  return response.data
}

export const downloadSQL = async (sessionId) => {
  const response = await api.get(`/api/download-sql/${sessionId}`, {
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

export const checkHealth = async () => {
  const response = await api.get('/openapi.json')
  return response.data
}

export default api
