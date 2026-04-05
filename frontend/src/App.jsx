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

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')
  const [error, setError] = useState('')

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
    try {
      const response = await predictSingle({
        url,
        model: predictModel,
        test_mode: testMode,
      })
      setPredictionResult(response)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBulkPredict(event) {
    event.preventDefault()
    setError('')
    setBulkResult([])

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
    }
  }

  async function handleCompare() {
    setError('')
    try {
      const response = await compareModels()
      setCompareResult(response)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStartTraining(event) {
    event.preventDefault()
    setError('')
    try {
      await startTraining(trainModel)
      await refreshTrainingStatus()
    } catch (err) {
      setError(err.message)
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

  return (
    <div className="container">
      <header>
        <h1>Phishing Detection API Dashboard</h1>
        <p>Backend status: <strong>{apiStatus}</strong></p>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <section className="card">
        <h2>Single URL Prediction</h2>
        <form onSubmit={handlePredict}>
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            required
          />
          <div className="row">
            <select value={predictModel} onChange={(event) => setPredictModel(event.target.value)}>
              {MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select value={testMode} onChange={(event) => setTestMode(event.target.value)}>
              <option value="single">Single model</option>
              <option value="all">All models</option>
            </select>
            <button type="submit">Predict</button>
          </div>
        </form>

        {predictionResult ? (
          <div className="result">
            <p><strong>Prediction:</strong> {predictionResult.prediction}</p>
            <p><strong>Model:</strong> {predictionResult.model_name}</p>
            <p><strong>Confidence:</strong> {predictionResult.confidence ?? 'N/A'}</p>
            {topFeatures.length > 0 ? (
              <div>
                <p><strong>Top SHAP Features</strong></p>
                <ul>
                  {topFeatures.map((feature) => (
                    <li key={feature.feature}>{feature.feature}: {feature.importance.toFixed(4)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Bulk Prediction</h2>
        <form onSubmit={handleBulkPredict}>
          <textarea
            rows={6}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder="One URL per line"
          />
          <div className="row">
            <select value={bulkModel} onChange={(event) => setBulkModel(event.target.value)}>
              {MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <button type="submit">Run Bulk Prediction</button>
          </div>
        </form>

        {bulkResult.length > 0 ? (
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
                  <td>{item.prediction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="card">
        <h2>Model Comparison</h2>
        <button onClick={handleCompare}>Load Metrics</button>
        {compareResult.best_model ? <p><strong>Best model:</strong> {compareResult.best_model}</p> : null}
        {compareResult.results?.length > 0 ? (
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
        ) : null}
      </section>

      <section className="card">
        <h2>Train Models</h2>
        <form onSubmit={handleStartTraining}>
          <div className="row">
            <select value={trainModel} onChange={(event) => setTrainModel(event.target.value)}>
              {MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
              <option value="all">all</option>
            </select>
            <button type="submit" disabled={trainState.running}>Start Training</button>
            <button type="button" onClick={refreshTrainingStatus}>Refresh Status</button>
          </div>
        </form>

        <p><strong>Running:</strong> {String(Boolean(trainState.running))}</p>
        <p><strong>Completed:</strong> {String(Boolean(trainState.completed))}</p>
        <pre>{trainState.log || 'No training logs yet.'}</pre>
      </section>
    </div>
  )
}

export default App
