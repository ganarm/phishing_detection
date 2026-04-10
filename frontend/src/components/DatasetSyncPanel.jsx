import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import { getDatasetSyncStatus, syncUrlhausFeed } from '../api'

function DatasetSyncPanel({ isActive, setError }) {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState({
    source: 'URLhaus',
    configured: false,
    last_sync_at: null,
    last_sync_status: null,
    last_sync_message: null,
    total_rows: 0,
    last_added_count: 0,
    last_added_preview_count: 0,
    latest_rows: [],
  })

  function formatTimestamp(ts) {
    if (!ts) return 'Never'
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return ts
    return d.toLocaleString()
  }

  async function loadStatus() {
    setLoading(true)
    try {
      const response = await getDatasetSyncStatus(100)
      setStatus(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isActive) return
    loadStatus()
  }, [isActive])

  async function handleSync() {
    setSyncing(true)
    setError('')
    try {
      const response = await syncUrlhausFeed()
      setStatus(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
      <div className="section-head">
        <div>
          <h3>Threat Feed Sync</h3>
          <p className="muted">Pull fresh malicious URLs from URLhaus and append new rows into the local training dataset.</p>
        </div>
        <div className="dataset-sync-actions">
          <Button variant="outlined" size="small" sx={{color :"white"}} onClick={loadStatus} disabled={loading || syncing}>Refresh</Button>
          <Button variant="contained" size="small" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync URLhaus'}
          </Button>
        </div>
      </div>

      <div className="stats-grid dataset-sync-stats">
        <article className={`stat-card ${status.configured ? 'good' : 'danger'}`}>
          <p className="muted">Auth Key</p>
          <h3>{status.configured ? 'Configured' : 'Missing'}</h3>
        </article>
        <article className="stat-card neutral">
          <p className="muted">Total Synced Rows</p>
          <h3>{status.total_rows || 0}</h3>
        </article>
        <article className="stat-card neutral">
          <p className="muted">Added Last Sync</p>
          <h3>{status.last_added_count || 0}</h3>
        </article>
        <article className="stat-card neutral">
          <p className="muted">Preview Rows</p>
          <h3>{status.last_added_preview_count || 0}</h3>
        </article>
        <article className={`stat-card ${status.last_sync_status === 'ok' ? 'good' : 'neutral'}`}>
          <p className="muted">Last Sync</p>
          <h3>{formatTimestamp(status.last_sync_at)}</h3>
        </article>
      </div>

      <div className="info-strip">
        <strong>Source:</strong> {status.source || 'URLhaus'}.
        {' '}
        <strong>Note:</strong> URLhaus is a malware URL feed, so these synced rows enrich the malicious side of your dataset rather than pure phishing-only labels.
      </div>

      <div className="result-card">
        <p className="muted">Sync Status</p>
        <div className="result-details">
          <div>
            <strong>Status:</strong>
            {' '}
            <span className={`badge ${status.last_added_count > 0 ? 'danger' : status.last_sync_status === 'ok' ? 'good' : 'neutral'}`}>
              {status.last_added_count > 0 ? 'New rows added' : status.last_sync_status === 'ok' ? 'Up to date' : (status.last_sync_status || 'Not synced yet')}
            </span>
          </div>
          <div><strong>Message:</strong> {status.last_sync_message || 'No sync has been run yet.'}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading sync status...</div>
      ) : status.latest_rows?.length ? (
        <>
          <div className="info-strip">
            Showing the most recent batch of newly added rows kept from the last sync that introduced new data.
          </div>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Threat</th>
                <th>Status</th>
                <th>Host</th>
                <th>Added</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {status.latest_rows.map((row, idx) => (
                <tr key={`${row.URL}-${idx}`}>
                  <td className="scan-url-cell" title={row.URL}>{row.URL}</td>
                  <td><span className="badge danger">{row.threat_type || 'malware'}</span></td>
                  <td>{row.url_status || 'unknown'}</td>
                  <td>{row.host || 'N/A'}</td>
                  <td>{row.date_added || 'N/A'}</td>
                  <td>{row.tags || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <div className="empty-state">No newly added rows yet. Run a sync to pull fresh URLhaus data.</div>
      )}
    </section>
  )
}

export default DatasetSyncPanel
