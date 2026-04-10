function TrainPanel({
  isActive,
  trainModel,
  setTrainModel,
  MODELS,
  handleStartTraining,
  trainState,
  isLoadingTrainAction,
  refreshTrainingStatus,
}) {
  function currentStatus() {
    if (trainState.running) {
      return {
        label: `Training in progress${trainState.model_name ? ` for ${trainState.model_name}` : ''}`,
        tone: 'neutral',
      }
    }
    if (trainState.completed) {
      return {
        label: `Training completed${trainState.model_name ? ` for ${trainState.model_name}` : ''}`,
        tone: 'good',
      }
    }
    return {
      label: 'Not started yet',
      tone: 'neutral',
    }
  }

  const status = currentStatus()

  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
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

      <article className="result-card">
        <p className="muted">Current Status</p>
        <h4 className={`result-title result-title-${status.tone}`}>{status.label}</h4>
      </article>

      <pre>{trainState.log || 'No training logs yet.'}</pre>
    </section>
  )
}

export default TrainPanel
