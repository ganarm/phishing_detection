import { useEffect, useMemo, useState } from 'react'
import {
  health,
  predictSingle,
  predictBulk,
  compareModels,
  startTraining,
  trainingStatus,
} from './api'

const MODELS = ['RandomForest', 'DecisionTree', 'XGBoost', 'LogisticRegression']
const SECTIONS = ['predict', 'bulk', 'compare', 'train']

function App() {
  const [activeSection, setActiveSection] = useState('predict')
  const [apiStatus, setApiStatus] = useState('checking...')
  const [error, setError] = useState('')
  const [isLoadingPredict, setIsLoadingPredict] = useState(false)
  const [isLoadingBulk, setIsLoadingBulk] = useState(false)
  const [isLoadingCompare, setIsLoadingCompare] = useState(false)
  const [isLoadingTrainAction, setIsLoadingTrainAction] = useState(false)

  const [url, setUrl] = useState('')
  const [predictModel, setPredictModel] = useState(MODELS[0])
  const [testMode, setTestMode] = useState('single')
  const [predictionResult, setPredictionResult] = useState(null)

  const [bulkText, setBulkText] = useState('')
  const [bulkModel, setBulkModel] = useState(MODELS[0])
  const [bulkResult, setBulkResult] = useState([])

  const [compareResult, setCompareResult] = useState({ results: [], best_model: null })

  const [trainModel, setTrainModel] = useState('RandomForest')
  const [trainState, setTrainState] = useState({ running: false, completed: false, log: '' })

  useEffect(() => {
    async function boot() {
      try {
        const response = await health()
        setApiStatus(response.status)
      } catch (err) {
        setApiStatus('offline')
        setError(err.message)
      }
    }

    boot()
  }, [])

  async function handlePredict(event) {
    event.preventDefault()
    setError('')
    setPredictionResult(null)
    setIsLoadingPredict(true)
    try {
      const response = await predictSingle({
        url,
        model: predictModel,
        test_mode: testMode,
      })
      setPredictionResult(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingPredict(false)
    }
  }

  async function handleBulkPredict(event) {
    event.preventDefault()
    setError('')
    setBulkResult([])
    setIsLoadingBulk(true)

    try {
      const urls = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      if (urls.length === 0) {
        throw new Error('Please enter at least one URL for bulk prediction')
      }

      const response = await predictBulk(urls, bulkModel)
      setBulkResult(response.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingBulk(false)
    }
  }

  async function handleCompare() {
    setError('')
    setIsLoadingCompare(true)
    try {
      const response = await compareModels()
      setCompareResult(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingCompare(false)
    }
  }

  async function handleStartTraining(event) {
    event.preventDefault()
    setError('')
    setIsLoadingTrainAction(true)
    try {
      await startTraining(trainModel)
      await refreshTrainingStatus()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingTrainAction(false)
    }
  }

  async function refreshTrainingStatus() {
    try {
      const response = await trainingStatus()
      setTrainState(response)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTrainingStatus()
    }, 3000)

    return () => clearInterval(intervalId)
  }, [])

  const topFeatures = useMemo(() => {
    const features = predictionResult?.shap_explanations?.top_features || []
    return features.slice(0, 5)
  }, [predictionResult])

  const statCards = useMemo(
    () => [
      {
        label: 'API Health',
        value: apiStatus,
        tone: apiStatus === 'ok' ? 'good' : apiStatus === 'checking...' ? 'neutral' : 'danger',
      },
      {
        label: 'Bulk Results',
        value: bulkResult.length,
        tone: 'neutral',
      },
      {
        label: 'Models Compared',
        value: compareResult.results?.length || 0,
        tone: 'neutral',
      },
      {
        label: 'Training Running',
        value: trainState.running ? 'Yes' : 'No',
        tone: trainState.running ? 'warn' : 'neutral',
      },
    ],
    [apiStatus, bulkResult.length, compareResult.results, trainState.running],
  )

  const navItems = [
    { id: 'predict', label: 'Threat Scan' },
    { id: 'bulk', label: 'Bulk Analysis' },
    { id: 'compare', label: 'Model Lab' },
    { id: 'train', label: 'Training Ops' },
  ]

  function getSectionClass(sectionId) {
    return activeSection === sectionId ? 'workspace-pane active' : 'workspace-pane'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-kicker">Security Platform</p>
          <h1>PhishingShield</h1>
          <p className="brand-subtitle">Detect, compare, and train phishing models from one control plane.</p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeSection === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="status-card">
          <p className="muted">Backend status</p>
          <p className={apiStatus === 'ok' ? 'status-text good' : 'status-text'}>{apiStatus}</p>
          <p className="muted">Active modules: {SECTIONS.length}</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="page-kicker">Operations Console</p>
            <h2>Threat Intelligence Workspace</h2>
          </div>
          <div className="chips-row">
            <span className="chip">Environment: Local</span>
            <span className="chip">API: /api</span>
          </div>
        </header>

        <section className="stats-grid">
          {statCards.map((card) => (
            <article key={card.label} className={`stat-card ${card.tone}`}>
              <p className="muted">{card.label}</p>
              <h3>{card.value}</h3>
            </article>
          ))}
        </section>

        {error ? <div className="alert error">{error}</div> : null}

        <section className={getSectionClass('predict')}>
          <div className="section-head">
            <div>
              <h3>Single URL Threat Scan</h3>
              <p className="muted">Run fast phishing checks with explainable model outputs.</p>
            </div>
          </div>

          <form onSubmit={handlePredict} className="panel-form">
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
            />
            <div className="toolbar-row">
              <select value={predictModel} onChange={(event) => setPredictModel(event.target.value)}>
                {MODELS.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <select value={testMode} onChange={(event) => setTestMode(event.target.value)}>
                <option value="single">Single model</option>
                <option value="all">All models</option>
              </select>
              <button type="submit" disabled={isLoadingPredict}>{isLoadingPredict ? 'Scanning...' : 'Scan URL'}</button>
            </div>
          </form>

          {predictionResult ? (
            <div className="result-grid">
              <article className="result-card">
                <p className="muted">Prediction</p>
                <h4>{predictionResult.prediction}</h4>
                <p className="muted">Model: {predictionResult.model_name}</p>
                <p className="muted">Confidence: {predictionResult.confidence ?? 'N/A'}</p>
              </article>

              <article className="result-card">
                <p className="muted">Top SHAP Features</p>
                {topFeatures.length > 0 ? (
                  <ul className="feature-list">
                    {topFeatures.map((feature) => (
                      <li key={feature.feature}>
                        <span>{feature.feature}</span>
                        <span>{feature.importance.toFixed(4)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No SHAP explanation available.</p>
                )}
              </article>
            </div>
          ) : (
            <div className="empty-state">No prediction yet. Submit a URL to start analysis.</div>
          )}
        </section>

        <section className={getSectionClass('bulk')}>
          <div className="section-head">
            <div>
              <h3>Bulk URL Analysis</h3>
              <p className="muted">Batch-screen large URL lists with a chosen model.</p>
            </div>
          </div>

          <form onSubmit={handleBulkPredict} className="panel-form">
            <textarea
              rows={7}
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder="One URL per line"
            />
            <div className="toolbar-row">
              <select value={bulkModel} onChange={(event) => setBulkModel(event.target.value)}>
                {MODELS.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button type="submit" disabled={isLoadingBulk}>{isLoadingBulk ? 'Processing...' : 'Run Bulk Scan'}</button>
            </div>
          </form>

          {bulkResult.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Prediction</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResult.map((item, index) => (
                    <tr key={`${item.url}-${index}`}>
                      <td>{item.url}</td>
                      <td>
                        <span className={item.prediction === 'Phishing' ? 'badge danger' : 'badge good'}>{item.prediction}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No bulk results yet.</div>
          )}
        </section>

        <section className={getSectionClass('compare')}>
          <div className="section-head">
            <div>
              <h3>Model Comparison Lab</h3>
              <p className="muted">Review metrics and identify best-performing model.</p>
            </div>
            <button onClick={handleCompare} disabled={isLoadingCompare}>{isLoadingCompare ? 'Loading...' : 'Load Metrics'}</button>
          </div>

          {compareResult.best_model ? (
            <div className="info-strip">Best model: <strong>{compareResult.best_model}</strong></div>
          ) : null}

          {compareResult.results?.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {Object.keys(compareResult.results[0]).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareResult.results.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(row).map((column) => (
                        <td key={`${index}-${column}`}>{String(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Metrics are not loaded yet.</div>
          )}
        </section>

        <section className={getSectionClass('train')}>
          <div className="section-head">
            <div>
              <h3>Training Operations</h3>
              <p className="muted">Start model training and monitor logs in real time.</p>
            </div>
          </div>

          <form onSubmit={handleStartTraining} className="panel-form">
            <div className="toolbar-row">
              <select value={trainModel} onChange={(event) => setTrainModel(event.target.value)}>
                {MODELS.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
                <option value="all">all</option>
              </select>
              <button type="submit" disabled={trainState.running || isLoadingTrainAction}>
                {isLoadingTrainAction ? 'Submitting...' : 'Start Training'}
              </button>
              <button type="button" className="secondary" onClick={refreshTrainingStatus}>Refresh Status</button>
            </div>
          </form>

          <div className="result-grid">
            <article className="result-card">
              <p className="muted">Training Running</p>
              <h4>{String(Boolean(trainState.running))}</h4>
            </article>
            <article className="result-card">
              <p className="muted">Training Completed</p>
              <h4>{String(Boolean(trainState.completed))}</h4>
            </article>
          </div>

          <pre>{trainState.log || 'No training logs yet.'}</pre>
        </section>
      </main>
    </div>
  )
}

export default App
