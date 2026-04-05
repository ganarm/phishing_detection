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
  )
}

export default TrainPanel
