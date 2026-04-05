function BulkPanel({
  isActive,
  bulkText,
  setBulkText,
  bulkModel,
  setBulkModel,
  isLoadingBulk,
  handleBulkPredict,
  MODELS,
  bulkResult,
}) {
  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
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
  )
}

export default BulkPanel
