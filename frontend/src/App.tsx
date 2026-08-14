import { useState, useEffect } from 'react'

const ENDPOINTS = [
  { label: 'Root',   url: '/',           desc: 'Server info' },
  { label: 'Health', url: '/api/health', desc: 'Health check' },
]

function StatusCard({ icon, label, value, badge }: {
  icon: string; label: string; value: string; badge?: { text: string; cls: string }
}) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <div className="card-label">{label}</div>
      {badge
        ? <span className={`badge badge-${badge.cls}`}><span className="pulse-dot" /> {badge.text}</span>
        : <div className="card-value">{value}</div>
      }
    </div>
  )
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState<Record<string, boolean>>({})

  // Auto-check backend on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setBackendStatus('online') : setBackendStatus('offline'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  const testEndpoint = async (url: string) => {
    setLoading(l => ({ ...l, [url]: true }))
    setResponses(r => ({ ...r, [url]: '' }))
    try {
      const res  = await fetch(url)
      const data = await res.json()
      setResponses(r => ({ ...r, [url]: JSON.stringify(data, null, 2) }))
    } catch (e: any) {
      setResponses(r => ({ ...r, [url]: `❌ Error: ${e.message}` }))
    } finally {
      setLoading(l => ({ ...l, [url]: false }))
    }
  }

  const statusBadge = {
    checking: { text: 'Checking…', cls: 'warning' },
    online:   { text: 'Online',    cls: 'success' },
    offline:  { text: 'Offline',   cls: 'danger'  },
  }[backendStatus]

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="logo">🏥</div>
        <div>
          <h1>Smart Clinic</h1>
          <p>Frontend ↔ Backend Connection Test</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="cards-grid">
        <StatusCard icon="⚛️" label="Frontend" value="React + Vite"
          badge={{ text: 'Running', cls: 'success' }} />
        <StatusCard icon="🖥️" label="Backend"  value=""
          badge={statusBadge} />
        <StatusCard icon="🗄️" label="Database" value=""
          badge={{ text: 'PostgreSQL', cls: 'info' }} />
        <StatusCard icon="🔌" label="API Port"  value=":5000" />
      </div>

      
      {/* Info Panel */}
      <div className="panel">
        <div className="panel-title">📋 Stack Info</div>
        <div className="endpoint-list">
          {[
            ['Frontend', 'React 18 + TypeScript + Vite', 'info'],
            ['Backend',  'Node.js + Express.js (port 5000)', 'info'],
            ['Database', 'PostgreSQL (connect via .env)', 'warning'],
            ['Proxy',    'Vite proxies /api → localhost:5000', 'success'],
          ].map(([label, value, cls]) => (
            <div className="endpoint-row" key={label}>
              <span className="card-label" style={{ minWidth: 90 }}>{label}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{value}</span>
              <span className={`badge badge-${cls}`}>{cls === 'warning' ? '⚠ Needs config' : '✓'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        Smart Clinic © 2026 — Sample test page. Replace with real pages when ready.
      </div>
    </div>
  )
}
