import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

function PredictPanel({
  isActive,
  url,
  setUrl,
  predictModel,
  setPredictModel,
  testMode,
  setTestMode,
  isLoadingPredict,
  handlePredict,
  MODELS,
  predictionResult,
  topFeatures,
}) {
  const hasAllModels = Boolean(
    predictionResult?.test_mode === 'all' &&
    predictionResult?.all_models_results &&
    Object.keys(predictionResult.all_models_results).length,
  )
  const modelEntries = hasAllModels ? Object.entries(predictionResult.all_models_results) : []

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(url || '')
      // eslint-disable-next-line no-alert
      alert('URL copied to clipboard')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('copy failed', e)
    }
  }

  function riskLabel(pred, conf) {
    if (!pred) return { label: 'Unknown', tone: 'neutral' }
    const isPhish = String(pred).toLowerCase().includes('phish')
    if (isPhish) return { label: 'High Risk', tone: 'danger' }
    // otherwise use confidence threshold
    if (conf >= 0.8) return { label: 'Likely Safe', tone: 'good' }
    return { label: 'Low Risk', tone: 'neutral' }
  }

  function formatConfidence(conf) {
    return conf != null ? Number(conf).toFixed(2) : 'N/A'
  }

  function renderProbabilities(probabilities) {
    if (!probabilities) return null
    return (
      <div className="score-row">
        {Object.entries(probabilities).map(([k, v]) => (
          <div key={k} className="score-item"><strong>{k}</strong>: {Number(v).toFixed(3)}</div>
        ))}
      </div>
    )
  }

  function renderFeatures(features, emptyLabel = 'No SHAP explanation available.') {
    if (!features?.length) return <p className="muted">{emptyLabel}</p>
    return (
      <ul className="feature-list">
        {features.map((feature) => (
          <li key={feature.feature}>
            <span>{feature.feature}</span>
            <span>{Number(feature.importance).toFixed(4)}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
      <div className="section-head">
        <div>
          <h3>Single URL Threat Scan</h3>
          <p className="muted">Run fast phishing checks with explainable model outputs.</p>
        </div>
      </div>

      <form onSubmit={handlePredict} className="panel-form">
        <TextField
          label="URL"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
          maxRows={10}
          variant="outlined"
          size="small"
          sx={{
            width: { xs: '100%', sm: '68%', md: '56%' },
            maxWidth: 780,
            '& .MuiInputBase-root': { height: 40 },
          }}
        />

        <div className="toolbar-row">
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField select label="Model" value={predictModel} onChange={(e) => setPredictModel(e.target.value)} size="small">
              {MODELS.map((model) => (
                <MenuItem key={model} value={model}>{model}</MenuItem>
              ))}
            </TextField>

            <TextField select label="Mode" value={testMode} onChange={(e) => setTestMode(e.target.value)} size="small">
              <MenuItem value="single">Single model</MenuItem>
              <MenuItem value="all">All models</MenuItem>
            </TextField>

            <Button type="submit" variant="contained" color="primary" disabled={isLoadingPredict}>
              {isLoadingPredict ? 'Scanning...' : 'Scan URL'}
            </Button>
          </Stack>
        </div>
      </form>

      {predictionResult ? (
        <div className="result-grid">
          <article className="result-card result-main">
            <p className="muted">{hasAllModels ? 'Prediction Summary' : 'Prediction'}</p>
            <div className="result-header">
              <h4 className="result-title">{predictionResult.prediction}</h4>
              <span className={`prediction-badge ${riskLabel(predictionResult.prediction, predictionResult.confidence).tone}`}>
                {riskLabel(predictionResult.prediction, predictionResult.confidence).label}
              </span>
            </div>

            <div className="result-details">
              <div><strong>Mode:</strong> {hasAllModels ? 'All models' : 'Single model'}</div>
              <div><strong>Model:</strong> {hasAllModels ? 'Consensus summary' : (predictionResult.model_name || 'N/A')}</div>
              <div><strong>Confidence:</strong> {formatConfidence(predictionResult.confidence)}</div>
              {renderProbabilities(predictionResult.probabilities)}

              <div className="muted" style={{ marginTop: 8 }}>
                {predictionResult.explanation || 'Model used a set of lexical and structural URL features to determine risk.'}
              </div>

              <div className="result-actions">
                <button type="button" className="btn-secondary" onClick={handleCopyUrl}>Copy URL</button>
                {url ? (
                  <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">Open URL</a>
                ) : null}
              </div>
            </div>
          </article>

          <article className="result-card result-shap">
            <p className="muted">{hasAllModels ? 'Model Breakdown' : 'Top SHAP Features'}</p>
            {hasAllModels ? (
              <div className="result-details">
                {modelEntries.map(([modelName, result]) => {
                  const modelTopFeatures = result?.shap_explanations?.top_features?.slice(0, 5) || []
                  return (
                    <article key={modelName} className="result-card">
                      <div className="result-header">
                        <h4 className="result-title">{modelName}</h4>
                        <span className={`prediction-badge ${riskLabel(result?.prediction, result?.confidence).tone}`}>
                          {riskLabel(result?.prediction, result?.confidence).label}
                        </span>
                      </div>

                      <div className="result-details">
                        {'error' in (result || {}) ? (
                          <p className="muted">{result.error}</p>
                        ) : (
                          <>
                            <div><strong>Prediction:</strong> {result?.prediction || 'N/A'}</div>
                            <div><strong>Confidence:</strong> {formatConfidence(result?.confidence)}</div>
                            {renderProbabilities(result?.probabilities)}
                            <div className="muted">
                              {result?.explanation || 'Model used a set of lexical and structural URL features to determine risk.'}
                            </div>
                            <div>
                              <strong>Top SHAP Features</strong>
                            </div>
                            {renderFeatures(modelTopFeatures)}
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              renderFeatures(topFeatures)
            )}
          </article>
        </div>
      ) : (
        <div className="empty-state">No prediction yet. Submit a URL to start analysis.</div>
      )}
    </section>
  )
}

export default PredictPanel
