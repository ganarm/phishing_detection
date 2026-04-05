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
  )
}

export default PredictPanel
