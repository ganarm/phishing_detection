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
  )
}

export default PredictPanel
