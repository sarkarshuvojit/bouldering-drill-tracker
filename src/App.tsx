import { useState, useEffect } from 'react'
import './App.css'

interface Drill {
  id: string
  name: string
  description: string
  date: string
  completed: boolean
}

function App() {
  const [drills, setDrills] = useState<Drill[]>([])
  const [newDrillName, setNewDrillName] = useState('')
  const [newDrillDescription, setNewDrillDescription] = useState('')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const savedDrills = localStorage.getItem('bouldering-drills')
    if (savedDrills) {
      setDrills(JSON.parse(savedDrills))
    }

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
    localStorage.setItem('bouldering-drills', JSON.stringify(drills))
  }, [drills])

  const addDrill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDrillName.trim()) return

    const newDrill: Drill = {
      id: Date.now().toString(),
      name: newDrillName,
      description: newDrillDescription,
      date: new Date().toISOString(),
      completed: false,
    }

    setDrills([newDrill, ...drills])
    setNewDrillName('')
    setNewDrillDescription('')
  }

  const toggleDrill = (id: string) => {
    setDrills(drills.map(drill =>
      drill.id === id ? { ...drill, completed: !drill.completed } : drill
    ))
  }

  const deleteDrill = (id: string) => {
    setDrills(drills.filter(drill => drill.id !== id))
  }

  return (
    <div className="app">
      <header>
        <h1>Bouldering Drill Tracker</h1>
        <div className={`status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </header>

      <form onSubmit={addDrill} className="drill-form">
        <input
          type="text"
          placeholder="Drill name..."
          value={newDrillName}
          onChange={(e) => setNewDrillName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)..."
          value={newDrillDescription}
          onChange={(e) => setNewDrillDescription(e.target.value)}
          rows={3}
        />
        <button type="submit">Add Drill</button>
      </form>

      <div className="drills-list">
        {drills.length === 0 ? (
          <p className="empty-state">No drills yet. Add your first one above!</p>
        ) : (
          drills.map(drill => (
            <div key={drill.id} className={`drill-card ${drill.completed ? 'completed' : ''}`}>
              <div className="drill-header">
                <h3>{drill.name}</h3>
                <span className="drill-date">
                  {new Date(drill.date).toLocaleDateString()}
                </span>
              </div>
              {drill.description && (
                <p className="drill-description">{drill.description}</p>
              )}
              <div className="drill-actions">
                <button
                  onClick={() => toggleDrill(drill.id)}
                  className="toggle-btn"
                >
                  {drill.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button
                  onClick={() => deleteDrill(drill.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <footer>
        <p>Drills are saved locally and work offline</p>
      </footer>
    </div>
  )
}

export default App
