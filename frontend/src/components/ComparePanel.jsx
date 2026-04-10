import { useState, useEffect } from 'react'

function ComparePanel({ isActive, compareResult, isLoadingCompare, handleCompare }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalModel, setModalModel] = useState(null)

  function openModelModal(model) {
    setModalModel(model)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalModel(null)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && modalOpen) closeModal()
    }
    if (modalOpen) {
      window.addEventListener('keydown', onKey)
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const results = compareResult.results || []
  const best = compareResult.best_model

  return (
    <section className={isActive ? 'workspace-pane active' : 'workspace-pane'}>
      <div className="section-head">
        <div>
          <h3>Model Performance Comparison</h3>
          <p className="muted">Analyze and compare performance metrics across models.</p>
        </div>
        <div>
          <button onClick={handleCompare} disabled={isLoadingCompare}>{isLoadingCompare ? 'Loading...' : 'Load Metrics'}</button>
        </div>
      </div>

      {results.length > 0 ? (
        <>
          {/* Best model alert */}
          {best ? (
            <div className="alert good" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>🏆</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Best Performing Model: {best}</div>
                  <div className="muted">This model shows the highest accuracy and is recommended for production use.</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Performance Overview Cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {results.map((m) => {
              const accuracy = Number(m.Accuracy || 0)
              const isBest = m.Model === best
              return (
                <div key={m.Model} style={{ flex: '1 1 220px', minWidth: 220 }}>
                  <div className={`stat-card ${isBest ? 'good' : ''}`}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0 }}>{m.Model}</h4>
                        {isBest ? <span className="badge good">Best</span> : null}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 12, background: '#eef2ff', borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(accuracy * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#60a5fa,#1e40af)' }} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div className="muted">Accuracy</div>
                          <div style={{ fontWeight: 800, color: 'var(--primary-2)' }}>{(accuracy * 100).toFixed(2)}%</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        <div className="chip">
                          <small>F1</small>
                          <div style={{ fontWeight: 700 }}>{Number(m['F1 Score'] || 0).toFixed(3)}</div>
                        </div>
                        <div className="chip">
                          <small>Time (s)</small>
                          <div style={{ fontWeight: 700 }}>{Number(m['Training Time (s)'] || 0).toFixed(2)}</div>
                        </div>
                        <div className="chip">
                          <small>Precision</small>
                          <div style={{ fontWeight: 700 }}>{Number(m.Precision || 0).toFixed(3)}</div>
                        </div>
                        <div className="chip">
                          <small>Recall</small>
                          <div style={{ fontWeight: 700 }}>{Number(m.Recall || 0).toFixed(3)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed Metrics Table */}
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h3 className="card-title mb-0">Detailed Performance Metrics</h3>
            </div>
            <div className="card-body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Accuracy</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1 Score</th>
                      <th>Confusion Matrix</th>
                      <th>Training Time</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((m, idx) => (
                      <tr key={m.Model} className={m.Model === best ? 'table-success' : ''}>
                        <td><strong>{m.Model}</strong></td>
                        <td><span className="badge good">{((Number(m.Accuracy || 0) * 100)).toFixed(2)}%</span></td>
                        <td>{Number(m.Precision || 0).toFixed(4)}</td>
                        <td>{Number(m.Recall || 0).toFixed(4)}</td>
                        <td><span className="badge" style={{ background: '#dbeafe' }}>{Number(m['F1 Score'] || 0).toFixed(4)}</span></td>
                        <td><small className="muted" style={{ maxWidth: 240, display: 'inline-block' }}>{m['Confusion Matrix'] || '-'}</small></td>
                        <td><span className="badge">{Number(m['Training Time (s)'] || 0).toFixed(2)}s</span></td>
                        {/* <td>
                          <button className="btn-secondary" type="button" onClick={() => openModelModal(m)}>Details</button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Model Explanations */}
          <div className="card shadow-sm mb-4">
            <div className="card-header"><h3 className="card-title mb-0">Model Explanations</h3></div>
            <div className="card-body">
              {results.map((m) => (
                <div key={`ex-${m.Model}`} className="learn-card" style={{ marginBottom: 12 }}>
                  <h4 style={{ marginBottom: 6 }}>{m.Model} {m.Model === best ? <span className="badge good">Recommended</span> : null}</h4>
                  <p className="muted">{getModelDescription(m.Model)}</p>
                  <ul className="learn-list" style={{ marginTop: 8 }}>
                    <li><strong>Strengths:</strong> {getStrengths(m.Model)}</li>
                    <li><strong>Best for:</strong> {getBestFor(m.Model)}</li>
                    <li><strong>Accuracy:</strong> {((Number(m.Accuracy || 0) * 100)).toFixed(2)}%</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset Information */}
          <div className="card shadow-sm">
            <div className="card-header"><h3 className="card-title mb-0">Training Dataset Information</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <h5>PhiUSIIL Phishing URL Dataset</h5>
                  <p className="muted">All models were trained on the PhiUSIIL dataset, which contains a balanced collection of legitimate and phishing URLs.</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <div className="stat-card" style={{ padding: 12, textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--primary-2)' }}>235,795</h4>
                      <small className="muted">Total URLs</small>
                    </div>
                    <div className="stat-card" style={{ padding: 12, textAlign: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--good)' }}>134,850</h4>
                      <small className="muted">Legitimate URLs</small>
                    </div>
                  </div>
                </div>
                <div style={{ width: 220, textAlign: 'center' }}>
                  <div style={{ fontSize: 44, color: 'var(--primary)' }}>📊</div>
                  <p className="muted" style={{ fontSize: 12 }}>Models trained on 50+ extracted features including URL structure, domain analysis, and character patterns.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <div style={{ fontSize: 42, color: '#f59e0b' }}>⚠️</div>
            <h3 className="muted mb-3">No Trained Models Found</h3>
            <p className="lead text-secondary mb-4">You need to train machine learning models before comparing their performance. The comparison feature requires trained models with saved metrics.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn" type="button" >Train Models Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for model details */}
      {modalOpen && modalModel ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Model Details — {modalModel.Model}</strong>
              <button className="icon-btn" onClick={closeModal} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <h4>Confusion Matrix</h4>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{String(modalModel['Confusion Matrix'] || 'N/A')}</pre>
              <h4>Full Metrics</h4>
              <pre>{JSON.stringify(modalModel, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  )
}

function getModelDescription(name) {
  if (!name) return ''
  if (name === 'RandomForest') return 'Random Forest is an ensemble learning method that constructs multiple decision trees during training and outputs the class that is the mode of the classes of the individual trees.'
  if (name === 'XGBoost') return 'XGBoost is an optimized distributed gradient boosting library designed to be highly efficient, flexible and portable.'
  if (name === 'DecisionTree') return 'Decision Tree creates a model that predicts the value of a target variable by learning simple decision rules inferred from the data features.'
  if (name === 'LogisticRegression') return 'Logistic Regression is a statistical model that uses a logistic function to model a binary dependent variable.'
  return ''
}

function getStrengths(name) {
  if (name === 'RandomForest') return 'High accuracy, handles overfitting well, works with large datasets'
  if (name === 'XGBoost') return 'Excellent performance, handles missing values, parallel processing'
  if (name === 'DecisionTree') return 'Easy to interpret, handles both numerical and categorical data'
  if (name === 'LogisticRegression') return 'Simple, interpretable, fast training, works well with linear relationships'
  return ''
}

function getBestFor(name) {
  if (name === 'RandomForest') return 'General-purpose classification tasks'
  if (name === 'XGBoost') return 'High-performance applications requiring speed'
  if (name === 'DecisionTree') return 'When model interpretability is important'
  if (name === 'LogisticRegression') return 'Baseline models and when interpretability is key'
  return ''
}

export default ComparePanel
