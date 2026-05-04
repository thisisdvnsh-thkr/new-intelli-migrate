import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const MigrationContext = createContext(null)
const SESSIONS_STORAGE_KEY = 'intelli-session-history'

function loadStoredSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function MigrationProvider({ children }) {
  const [session, setSession] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const [parseResult, setParseResult] = useState(null)
  const [mappingResult, setMappingResult] = useState(null)
  const [anomalyResult, setAnomalyResult] = useState(null)
  const [normalizeResult, setNormalizeResult] = useState(null)
  const [sqlResult, setSqlResult] = useState(null)
  const [deployResult, setDeployResult] = useState(null)

  const [sessionHistory, setSessionHistory] = useState(() => loadStoredSessions())
  const [activeSessionId, setActiveSessionId] = useState(
    () => loadStoredSessions()[0]?.sessionId || null
  )

  const [stats, setStats] = useState({
    sessionId: null,
    filesProcessed: 0,
    tablesGenerated: 0,
    anomaliesFound: 0,
    confidence: 0,
    recordsProcessed: 0,
    fileName: null,
    fileType: null,
    fileSizeBytes: 0,
    rows: 0,
    cols: 0,
    provider: 'postgresql',
    qualityScore: 100
  })

  useEffect(() => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionHistory))
  }, [sessionHistory])

  const activeSession = useMemo(
    () => sessionHistory.find((item) => item.sessionId === activeSessionId) || null,
    [sessionHistory, activeSessionId]
  )

  const resetSession = useCallback(() => {
    setSession(null)
    setCurrentStep(0)
    setIsProcessing(false)
    setError(null)
    setParseResult(null)
    setMappingResult(null)
    setAnomalyResult(null)
    setNormalizeResult(null)
    setSqlResult(null)
    setDeployResult(null)
    setStats((prev) => ({
      ...prev,
      sessionId: null,
      fileName: null,
      fileType: null,
      fileSizeBytes: 0,
      rows: 0,
      cols: 0,
      tablesGenerated: 0,
      anomaliesFound: 0,
      confidence: 0,
      qualityScore: 100
    }))
  }, [])

  const updateStats = useCallback((newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }))
  }, [])

  const addOrActivateSession = useCallback((sessionPayload) => {
    const createdAt = new Date().toISOString()
    const next = {
      sessionId: sessionPayload.sessionId,
      fileName: sessionPayload.fileName || 'Untitled file',
      fileSizeBytes: sessionPayload.fileSizeBytes || 0,
      rows: sessionPayload.rows || 0,
      cols: sessionPayload.cols || 0,
      fileType: sessionPayload.fileType || 'unknown',
      currentStep: sessionPayload.currentStep || 1,
      status: sessionPayload.status || 'active',
      provider: sessionPayload.provider || 'postgresql',
      updatedAt: createdAt,
      createdAt,
      mappingConfidence: 0,
      qualityScore: 100
    }

    setSessionHistory((prev) => {
      const filtered = prev.filter((item) => item.sessionId !== next.sessionId)
      return [next, ...filtered]
    })
    setActiveSessionId(next.sessionId)
    setSession(next.sessionId)
    setCurrentStep(next.currentStep)
    setStats((prev) => ({
      ...prev,
      sessionId: next.sessionId,
      fileName: next.fileName,
      fileType: next.fileType,
      fileSizeBytes: next.fileSizeBytes,
      rows: next.rows,
      cols: next.cols,
      recordsProcessed: next.rows || prev.recordsProcessed
    }))
  }, [])

  const updateSessionMeta = useCallback((sessionId, patch) => {
    if (!sessionId) return
    setSessionHistory((prev) =>
      prev.map((item) =>
        item.sessionId === sessionId
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }, [])

  const setActiveSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId)
    const selected = sessionHistory.find((item) => item.sessionId === sessionId)
    if (!selected) return
    setSession(sessionId)
    setCurrentStep(selected.currentStep || 0)
    setStats((prev) => ({
      ...prev,
      sessionId: selected.sessionId,
      fileName: selected.fileName,
      fileType: selected.fileType,
      fileSizeBytes: selected.fileSizeBytes || 0,
      rows: selected.rows || 0,
      cols: selected.cols || 0,
      provider: selected.provider || prev.provider,
      confidence: selected.mappingConfidence || prev.confidence,
      qualityScore: selected.qualityScore || prev.qualityScore
    }))
  }, [sessionHistory])

  const setStepWithSession = useCallback((step, patch = {}) => {
    setCurrentStep(step)
    if (stats.sessionId) {
      updateSessionMeta(stats.sessionId, { currentStep: step, ...patch })
    }
  }, [stats.sessionId, updateSessionMeta])

  const value = {
    session, setSession,
    currentStep, setCurrentStep,
    isProcessing, setIsProcessing,
    error, setError,
    parseResult, setParseResult,
    mappingResult, setMappingResult,
    anomalyResult, setAnomalyResult,
    normalizeResult, setNormalizeResult,
    sqlResult, setSqlResult,
    deployResult, setDeployResult,
    stats, setStats, updateStats,
    resetSession,
    sessionHistory,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    addOrActivateSession,
    updateSessionMeta,
    setActiveSession,
    setStepWithSession
  }

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  )
}

export function useMigration() {
  const context = useContext(MigrationContext)
  if (!context) {
    throw new Error('useMigration must be used within MigrationProvider')
  }
  return context
}
