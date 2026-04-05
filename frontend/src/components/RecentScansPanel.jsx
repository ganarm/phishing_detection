import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { getScanHistory } from '../api'

function RecentScansPanel({ isActive }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isActive) return
    setLoading(true)
    setError('')
    getScanHistory(50)
      .then((res) => {
        setItems(res.results || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [isActive])

  function handleCopy(url) {
    try {
      navigator.clipboard.writeText(url || '')
      // eslint-disable-next-line no-alert
      alert('URL copied to clipboard')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
      <div className="section-head">
        <div>
          <h3>Recent Scans</h3>
          <p className="muted">Latest scan history (most recent first).</p>
        </div>
        <div>
          <Button variant="outlined" size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="empty-state">Loading recent scans...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No recent scans yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>URL</th>
                <th>Model</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.ts}-${idx}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{it.ts}</td>
                  <td style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis' }} title={it.url}>{it.url}</td>
                  <td>{it.model}</td>
                  <td>{it.prediction}</td>
                  <td>{it.confidence != null ? Number(it.confidence).toFixed(3) : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn-secondary" onClick={() => handleCopy(it.url)}>Copy</button>
                      {it.url ? (
                        <a className="btn-secondary" href={it.url} target="_blank" rel="noreferrer">Open</a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default RecentScansPanel
