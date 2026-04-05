import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

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

      <form onSubmit={handleBulkPredict} className="panel-form bulk-panel-form">
        <TextField
          label="URLs (one per line)"
          placeholder="https://example.com"
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          required
          fullWidth
          multiline
          // minRows={6}
          variant="filled"
          sx={{overflow:"auto" , margin:"5px"}}
        />

        <div className="toolbar-row">
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField select label="Model" value={bulkModel} onChange={(e) => setBulkModel(e.target.value)} size="small">
              {MODELS.map((model) => (
                <MenuItem key={model} value={model}>{model}</MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" color="primary" disabled={isLoadingBulk}>
              {isLoadingBulk ? 'Processing...' : 'Run Bulk Scan'}
            </Button>
          </Stack>
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
