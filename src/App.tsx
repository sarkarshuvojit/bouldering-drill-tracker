import { useState, useEffect, useRef } from 'react'

interface Config {
  restBetweenSets: number
  targetTouches: number
}

interface Touch {
  value: number
  timestamp: string
}

interface Session {
  id: string
  startTime: string
  endTime: string
  totalTime: number
  touches: Touch[]
  totalTouches: number
  falls: number
}

type AppState = 'idle' | 'active' | 'resting' | 'complete'

function App() {
  const [config, setConfig] = useState<Config>(() => {
    const saved = localStorage.getItem('bouldering-config')
    return saved ? JSON.parse(saved) : { restBetweenSets: 180, targetTouches: 100 }
  })
  const [showConfig, setShowConfig] = useState(false)
  const [state, setState] = useState<AppState>('idle')
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [touches, setTouches] = useState<Touch[]>([])
  const [currentTouchInput, setCurrentTouchInput] = useState('')
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('bouldering-sessions')
    return saved ? JSON.parse(saved) : []
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const timerRef = useRef<number | undefined>(undefined)
  const restTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    localStorage.setItem('bouldering-config', JSON.stringify(config))
  }, [config])

  useEffect(() => {
    localStorage.setItem('bouldering-sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (state === 'active') {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - sessionStartTime)
      }, 100)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state, sessionStartTime])

  useEffect(() => {
    if (state === 'resting' && restTimeLeft > 0) {
      restTimerRef.current = window.setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 100) {
            setState('active')
            return 0
          }
          return prev - 100
        })
      }, 100)
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }
  }, [state, restTimeLeft])

  const startSession = () => {
    const now = Date.now()
    setSessionStartTime(now)
    setElapsedTime(0)
    setTouches([])
    setState('active')
  }

  const addTouch = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseInt(currentTouchInput) || 0
    const touch: Touch = {
      value,
      timestamp: new Date().toISOString()
    }
    const newTouches = [...touches, touch]
    setTouches(newTouches)
    setCurrentTouchInput('')

    const totalTouches = newTouches.reduce((sum, t) => sum + t.value, 0)

    if (totalTouches >= config.targetTouches) {
      completeSession(newTouches)
    } else {
      setState('resting')
      setRestTimeLeft(config.restBetweenSets * 1000)
    }
  }

  const skipRest = () => {
    setState('active')
    setRestTimeLeft(0)
  }

  const completeSession = (finalTouches: Touch[]) => {
    const totalTime = Date.now() - sessionStartTime
    const totalTouches = finalTouches.reduce((sum, t) => sum + t.value, 0)
    const falls = finalTouches.length

    const session: Session = {
      id: Date.now().toString(),
      startTime: new Date(sessionStartTime).toISOString(),
      endTime: new Date().toISOString(),
      totalTime,
      touches: finalTouches,
      totalTouches,
      falls
    }

    setSessions([session, ...sessions])
    setState('complete')
  }

  const resetSession = () => {
    setState('idle')
    setElapsedTime(0)
    setTouches([])
    setRestTimeLeft(0)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const totalTouches = touches.reduce((sum, t) => sum + t.value, 0)
  const progress = (totalTouches / config.targetTouches) * 100

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Bouldering Drill Tracker
          </h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnline ? '● Online' : '● Offline'}
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {showConfig && (
          <div className="mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 glow">
            <h2 className="text-2xl font-bold mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rest Between Sets (seconds)</label>
                <input
                  type="number"
                  value={config.restBetweenSets}
                  onChange={(e) => setConfig({ ...config, restBetweenSets: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Touches</label>
                <input
                  type="number"
                  value={config.targetTouches}
                  onChange={(e) => setConfig({ ...config, targetTouches: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {state === 'idle' && (
          <div className="text-center py-12">
            <div className="mb-8">
              <p className="text-xl text-gray-300 mb-2">Ready to start your training?</p>
              <p className="text-gray-400">Target: {config.targetTouches} touches | Rest: {config.restBetweenSets}s</p>
            </div>
            <button
              onClick={startSession}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg transition-all transform hover:scale-105 glow"
            >
              Start Session
            </button>
          </div>
        )}

        {(state === 'active' || state === 'resting') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                <div className="text-sm text-gray-400 mb-1">Session Time</div>
                <div className="text-3xl font-bold">{formatTime(elapsedTime)}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                <div className="text-sm text-gray-400 mb-1">Total Touches</div>
                <div className="text-3xl font-bold">{totalTouches} / {config.targetTouches}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                <div className="text-sm text-gray-400 mb-1">Attempts</div>
                <div className="text-3xl font-bold">{touches.length}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-center mt-2 text-sm text-gray-400">
                {progress.toFixed(1)}% Complete
              </div>
            </div>

            {state === 'resting' ? (
              <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-500/30 text-center glow-red">
                <div className="text-sm text-orange-300 mb-2">Rest Period</div>
                <div className="text-5xl font-bold mb-4">{formatTime(restTimeLeft)}</div>
                <button
                  onClick={skipRest}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Skip Rest
                </button>
              </div>
            ) : (
              <form onSubmit={addTouch} className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 glow">
                <div className="text-center mb-4">
                  <label className="block text-lg font-semibold mb-2">Enter Touches</label>
                  <p className="text-sm text-gray-400">Enter 0 if you couldn't touch any holds</p>
                </div>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={currentTouchInput}
                    onChange={(e) => setCurrentTouchInput(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-2xl text-center"
                    placeholder="0"
                    min="0"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-bold transition-all transform hover:scale-105 glow-green"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}

            {touches.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-3">Recent Touches</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...touches].reverse().slice(0, 5).map((touch, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className={touch.value === 0 ? 'text-red-400' : 'text-green-400'}>
                        {touch.value === 0 ? 'Fall' : `${touch.value} touches`}
                      </span>
                      <span className="text-gray-400">
                        {new Date(touch.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state === 'complete' && (
          <div className="text-center py-12">
            <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-500/30 glow-green">
              <h2 className="text-3xl font-bold mb-4">Session Complete!</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-400">Time</div>
                  <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Touches</div>
                  <div className="text-2xl font-bold">{totalTouches}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Attempts</div>
                  <div className="text-2xl font-bold">{touches.length}</div>
                </div>
              </div>
            </div>
            <button
              onClick={resetSession}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg transition-all transform hover:scale-105"
            >
              New Session
            </button>
          </div>
        )}

        {sessions.length > 0 && state === 'idle' && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Session History</h2>
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-400">
                        {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Duration</div>
                      <div className="font-bold">{formatTime(session.totalTime)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-400">Touches</div>
                      <div className="text-xl font-bold text-green-400">{session.totalTouches}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Attempts</div>
                      <div className="text-xl font-bold">{session.falls}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg/Attempt</div>
                      <div className="text-xl font-bold">{(session.totalTouches / session.falls).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
