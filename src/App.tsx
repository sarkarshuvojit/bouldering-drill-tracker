import { useState, useEffect, useRef } from 'react'

// Import all button images
import button0 from './assets/buttons/button_sheet-0.png'
import button1 from './assets/buttons/button_sheet-1.png'
import button2 from './assets/buttons/button_sheet-2.png'
import button3 from './assets/buttons/button_sheet-3.png'
import button4 from './assets/buttons/button_sheet_2-0.png'
import button5 from './assets/buttons/button_sheet_2-1.png'
import button6 from './assets/buttons/button_sheet_2-2.png'
import button7 from './assets/buttons/button_sheet_2-3.png'

// Import notification sound
import notificationSound from './assets/notification_sound.mp3'

// Random climbing hold selector
const BUTTON_IMAGES = [button0, button1, button2, button3, button4, button5, button6, button7]
const getRandomHold = () => BUTTON_IMAGES[Math.floor(Math.random() * BUTTON_IMAGES.length)]

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
  // Random hold classes - picked once per component mount
  const [startHold] = useState(getRandomHold)
  const [submitHold] = useState(getRandomHold)
  const [skipHold] = useState(getRandomHold)
  const [newSessionHold] = useState(getRandomHold)

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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    localStorage.setItem('bouldering-config', JSON.stringify(config))
  }, [config])

  useEffect(() => {
    localStorage.setItem('bouldering-sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(notificationSound)
    audioRef.current.preload = 'auto'

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
            // Play notification sound when rest is over
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              audioRef.current.play().catch(err => console.log('Audio play failed:', err))
            }
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
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tight">
              DRILL TRACKER
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-mono">Indoor Bouldering</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-700 text-zinc-400 border border-zinc-600'}`}>
              {isOnline ? '● Live' : '● Offline'}
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
              aria-label="Settings"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {showConfig && (
          <div className="mb-8 p-6 rounded-xl wall-texture border border-zinc-700 chalk-dust">
            <h2 className="text-xl font-black text-zinc-100 mb-4 uppercase tracking-wide">Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wide">Rest Between Sets</label>

                {/* Quick presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[30, 60, 120, 180].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => setConfig({ ...config, restBetweenSets: seconds })}
                      className={`px-3 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                        config.restBetweenSets === seconds
                          ? 'bg-emerald-600 text-white border border-emerald-500'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`}
                    </button>
                  ))}
                </div>

                {/* Custom time input */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-zinc-500 mb-1 font-mono">Minutes</div>
                    <input
                      type="number"
                      value={Math.floor(config.restBetweenSets / 60)}
                      onChange={(e) => {
                        const mins = parseInt(e.target.value) || 0
                        const secs = config.restBetweenSets % 60
                        setConfig({ ...config, restBetweenSets: mins * 60 + secs })
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:outline-none text-zinc-100 font-mono text-center"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div className="text-zinc-600 font-black text-xl pt-5">:</div>
                  <div className="flex-1">
                    <div className="text-xs text-zinc-500 mb-1 font-mono">Seconds</div>
                    <input
                      type="number"
                      value={config.restBetweenSets % 60}
                      onChange={(e) => {
                        const secs = parseInt(e.target.value) || 0
                        const mins = Math.floor(config.restBetweenSets / 60)
                        setConfig({ ...config, restBetweenSets: mins * 60 + Math.min(secs, 59) })
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-emerald-500 focus:outline-none text-zinc-100 font-mono text-center"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-xs text-zinc-600 font-mono">
                    Total: {formatTime(config.restBetweenSets * 1000)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Target Touches</label>
                <input
                  type="number"
                  value={config.targetTouches}
                  onChange={(e) => setConfig({ ...config, targetTouches: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-zinc-500 focus:outline-none text-zinc-100 font-mono text-center text-xl"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {state === 'idle' && (
          <div className="text-center py-16">
            <div className="mb-10">
              <p className="text-2xl text-zinc-300 mb-3 font-bold">Ready to climb?</p>
              <p className="text-zinc-500 font-mono text-sm">
                <span className="text-emerald-400">{config.targetTouches}</span> touches •
                <span className="text-blue-400"> {config.restBetweenSets}s</span> rest
              </p>
            </div>
            <button
              onClick={startSession}
              className="climbing-hold-btn w-64 h-32 flex items-center justify-center mx-auto"
            >
              <img src={startHold} alt="" className="climbing-hold-img" />
              <span className="climbing-hold-text text-white font-black text-lg uppercase tracking-wide mix-blend-overlay opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.3)' }}>
                Start Session
              </span>
            </button>
          </div>
        )}

        {(state === 'active' || state === 'resting') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl wall-texture border border-zinc-700">
                <div className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wide">Time</div>
                <div className="text-3xl font-black text-zinc-100 font-mono">{formatTime(elapsedTime)}</div>
              </div>
              <div className="p-5 rounded-xl wall-texture border border-zinc-700">
                <div className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wide">Touches</div>
                <div className="text-3xl font-black text-zinc-100 font-mono">
                  <span className="text-emerald-400">{totalTouches}</span>
                  <span className="text-zinc-600"> / </span>
                  <span className="text-zinc-500">{config.targetTouches}</span>
                </div>
              </div>
              <div className="p-5 rounded-xl wall-texture border border-zinc-700">
                <div className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wide">Attempts</div>
                <div className="text-3xl font-black text-blue-400 font-mono">{touches.length}</div>
              </div>
            </div>

            <div className="p-5 rounded-xl wall-texture border border-zinc-700">
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-center mt-3 text-xs text-zinc-500 font-mono uppercase tracking-wide">
                {progress.toFixed(1)}% Complete
              </div>
            </div>

            {state === 'resting' ? (
              <div className="p-10 rounded-xl wall-texture border border-orange-600/50 text-center chalk-dust">
                <div className="text-xs text-orange-400 mb-2 font-mono uppercase tracking-wide">Rest</div>
                <div className="text-6xl font-black text-orange-400 mb-6 font-mono">{formatTime(restTimeLeft)}</div>
                <button
                  onClick={skipRest}
                  className="climbing-hold-btn w-48 h-24 flex items-center justify-center mx-auto"
                >
                  <img src={skipHold} alt="" className="climbing-hold-img" />
                  <span className="climbing-hold-text text-white font-black uppercase tracking-wide mix-blend-overlay opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.3)' }}>
                    Skip
                  </span>
                </button>
              </div>
            ) : (
              <form onSubmit={addTouch} className="p-8 rounded-xl wall-texture border border-zinc-700 chalk-dust">
                <div className="text-center mb-6">
                  <label className="block text-sm font-black text-zinc-300 mb-1 uppercase tracking-wider">Log Touches</label>
                  <p className="text-xs text-zinc-500 font-mono">Enter 0 for a fall</p>
                </div>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={currentTouchInput}
                    onChange={(e) => setCurrentTouchInput(e.target.value)}
                    className="flex-1 px-6 py-5 rounded-xl bg-zinc-800 border-2 border-zinc-700 focus:border-emerald-500 focus:outline-none text-3xl text-center text-zinc-100 font-mono font-black"
                    placeholder="0"
                    min="0"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="climbing-hold-btn w-32 h-24 flex items-center justify-center"
                  >
                    <img src={submitHold} alt="" className="climbing-hold-img" />
                    <span className="climbing-hold-text text-white font-black text-lg uppercase tracking-wide mix-blend-overlay opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.3)' }}>
                      Log
                    </span>
                  </button>
                </div>
              </form>
            )}

            {touches.length > 0 && (
              <div className="p-5 rounded-xl wall-texture border border-zinc-700">
                <h3 className="text-xs font-black text-zinc-400 mb-3 uppercase tracking-wider">Recent</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...touches].reverse().slice(0, 5).map((touch, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-mono">
                      <span className={touch.value === 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {touch.value === 0 ? '✗ Fall' : `✓ ${touch.value}`}
                      </span>
                      <span className="text-zinc-600 text-xs">
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
            <div className="mb-10 p-10 rounded-xl wall-texture border border-emerald-600/50 chalk-dust">
              <h2 className="text-2xl font-black text-emerald-400 mb-6 uppercase tracking-wider">Send Complete!</h2>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Time</div>
                  <div className="text-3xl font-black text-zinc-100 font-mono">{formatTime(elapsedTime)}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Touches</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono">{totalTouches}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-mono uppercase mb-1">Attempts</div>
                  <div className="text-3xl font-black text-blue-400 font-mono">{touches.length}</div>
                </div>
              </div>
            </div>
            <button
              onClick={resetSession}
              className="climbing-hold-btn w-64 h-32 flex items-center justify-center mx-auto"
            >
              <img src={newSessionHold} alt="" className="climbing-hold-img" />
              <span className="climbing-hold-text text-white font-black text-lg uppercase tracking-wide mix-blend-overlay opacity-90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.3)' }}>
                New Session
              </span>
            </button>
          </div>
        )}

        {sessions.length > 0 && state === 'idle' && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-zinc-300 mb-4 uppercase tracking-wider">Session Log</h2>
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="p-5 rounded-xl wall-texture border border-zinc-700 hover:border-zinc-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {new Date(session.startTime).toLocaleDateString()} • {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-600 uppercase tracking-wide font-mono">Duration</div>
                      <div className="font-black text-zinc-400 font-mono">{formatTime(session.totalTime)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wide font-mono">Touches</div>
                      <div className="text-2xl font-black text-emerald-400 font-mono">{session.totalTouches}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wide font-mono">Attempts</div>
                      <div className="text-2xl font-black text-blue-400 font-mono">{session.falls}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wide font-mono">Avg</div>
                      <div className="text-2xl font-black text-zinc-400 font-mono">{(session.totalTouches / session.falls).toFixed(1)}</div>
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
