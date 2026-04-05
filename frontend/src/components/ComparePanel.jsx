function ComparePanel({ isActive, compareResult, isLoadingCompare, handleCompare }) {
  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
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
  )
}

export default ComparePanel
