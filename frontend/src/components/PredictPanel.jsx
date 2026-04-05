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
            <p className="muted">Prediction</p>
            <div className="result-header">
              <h4 className="result-title">{predictionResult.prediction}</h4>
              <span className={`prediction-badge ${riskLabel(predictionResult.prediction, predictionResult.confidence).tone}`}>
                {riskLabel(predictionResult.prediction, predictionResult.confidence).label}
              </span>
            </div>

            <div className="result-details">
              <div><strong>Model:</strong> {predictionResult.model_name || 'N/A'}</div>
              <div><strong>Confidence:</strong> {predictionResult.confidence != null ? Number(predictionResult.confidence).toFixed(2) : 'N/A'}</div>
              {predictionResult.probabilities ? (
                <div className="score-row">
                  {Object.entries(predictionResult.probabilities).map(([k, v]) => (
                    <div key={k} className="score-item"><strong>{k}</strong>: {Number(v).toFixed(3)}</div>
                  ))}
                </div>
              ) : null}

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
  )
}

export default PredictPanel
