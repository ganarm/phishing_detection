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
  const successfulModels = modelEntries.filter(([, result]) => !result?.error)
  const phishingCount = successfulModels.filter(([, result]) => String(result?.prediction).toLowerCase().includes('phish')).length
  const legitimateCount = successfulModels.filter(([, result]) => String(result?.prediction).toLowerCase().includes('legit')).length
  const isPredictedPhishing = String(predictionResult?.prediction || '').toLowerCase().includes('phish')

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

  function predictionColor(pred, conf) {
    const tone = riskLabel(pred, conf).tone
    if (tone === 'good') return '#166534'
    if (tone === 'danger') return '#991b1b'
    return 'var(--text)'
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
      <>
        <div className="shap-legend">
          <span className="shap-legend-item good">Negative value: toward legitimate</span>
          <span className="shap-legend-item danger">Positive value: toward phishing</span>
          <span className="shap-legend-item neutral">Bigger absolute value: stronger influence</span>
        </div>

        <ul className="feature-list">
          {features.map((feature) => {
            const importance = Number(feature.importance)
            const tone = importance > 0 ? 'danger' : importance < 0 ? 'good' : 'neutral'
            const direction = importance > 0
              ? 'Toward phishing'
              : importance < 0
                ? 'Toward legitimate'
                : 'Neutral impact'

            return (
              <li key={feature.feature} className="feature-item">
                <div className="feature-copy">
                  <strong>{feature.feature}</strong>
                  <span className={`feature-impact ${tone}`}>{direction}</span>
                </div>
                <div className="feature-metrics">
                  {/* <span className="feature-strength"> {Math.abs(importance).toFixed(4)}</span> */}
                  <span className={`feature-value ${tone}`}>{importance.toFixed(4)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </>
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
            <TextField select label="Mode" value={testMode} onChange={(e) => setTestMode(e.target.value)} size="small">
              <MenuItem value="single">Single model</MenuItem>
              <MenuItem value="all">All models</MenuItem>
            </TextField>

            <TextField
              select
              label="Model"
              value={predictModel}
              onChange={(e) => setPredictModel(e.target.value)}
              size="small"
              disabled={testMode === 'all'}
            >
              {MODELS.map((model) => (
                <MenuItem key={model} value={model}>{model}</MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" color="primary" disabled={isLoadingPredict}>
              {isLoadingPredict ? 'Scanning...' : 'Scan URL'}
            </Button>
          </Stack>
        </div>
      </form>

      {predictionResult ? (
        <div className={`result-grid ${hasAllModels ? 'result-grid-all' : ''}`}>
          <article className="result-card result-main">
            <p className="muted">{hasAllModels ? 'Prediction Summary' : 'Prediction'}</p>
            <div className="result-header">
              <h4
                className={`result-title result-title-${riskLabel(predictionResult.prediction, predictionResult.confidence).tone}`}
                style={{ color: predictionColor(predictionResult.prediction, predictionResult.confidence) }}
              >
                {predictionResult.prediction}
              </h4>
              <span className={`prediction-badge ${riskLabel(predictionResult.prediction, predictionResult.confidence).tone}`}>
                {riskLabel(predictionResult.prediction, predictionResult.confidence).label}
              </span>
            </div>

            <div className="result-details">
              <div><strong>Mode:</strong> {hasAllModels ? 'All models' : 'Single model'}</div>
              <div><strong>Model:</strong> {hasAllModels ? 'Consensus summary' : (predictionResult.model_name || 'N/A')}</div>
              <div><strong>Confidence:</strong> {formatConfidence(predictionResult.confidence)}</div>
              {hasAllModels ? (
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="summary-stat-label">Models Compared</span>
                    <strong>{successfulModels.length}</strong>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-label">Phishing Votes</span>
                    <strong>{phishingCount}</strong>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-label">Legitimate Votes</span>
                    <strong>{legitimateCount}</strong>
                  </div>
                </div>
              ) : null}
              {renderProbabilities(predictionResult.probabilities)}

              <div className="muted" style={{ marginTop: 8 }}>
                {predictionResult.explanation || 'Model used a set of lexical and structural URL features to determine risk.'}
              </div>

              {!isPredictedPhishing ? (
                <div className="result-actions">
                  <button type="button" className="btn-secondary" onClick={handleCopyUrl}>Copy URL</button>
                  {url ? (
                    <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">Open URL</a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>

          <article className="result-card result-shap">
            <p className="muted">{hasAllModels ? 'Model Breakdown' : 'Top SHAP Features'}</p>
            {hasAllModels ? (
              <div className="model-breakdown-grid">
                {modelEntries.map(([modelName, result]) => {
                  const modelTopFeatures = result?.shap_explanations?.top_features?.slice(0, 5) || []
                  return (
                    <article key={modelName} className="compare-model-card">
                      <div className="result-header">
                        <div>
                          <p className="muted compare-model-label">Model</p>
                          <h4 className="result-title">{modelName}</h4>
                        </div>
                        <span className={`prediction-badge ${riskLabel(result?.prediction, result?.confidence).tone}`}>
                          {riskLabel(result?.prediction, result?.confidence).label}
                        </span>
                      </div>

                      {'error' in (result || {}) ? (
                        <p className="muted">{result.error}</p>
                      ) : (
                        <>
                          <div className="compare-model-stats">
                            <div className="compare-stat">
                              <span className="compare-stat-label">Prediction</span>
                              <strong>{result?.prediction || 'N/A'}</strong>
                            </div>
                            <div className="compare-stat">
                              <span className="compare-stat-label">Confidence</span>
                              <strong>{formatConfidence(result?.confidence)}</strong>
                            </div>
                          </div>

                          {renderProbabilities(result?.probabilities)}

                          <div className="muted compare-model-explanation">
                            {result?.explanation || 'Model used a set of lexical and structural URL features to determine risk.'}
                          </div>

                          <div className="compare-feature-head">
                            <strong>Top SHAP Features</strong>
                          </div>
                          {renderFeatures(modelTopFeatures)}
                        </>
                      )}
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
