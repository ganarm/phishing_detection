async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { error: await response.text() }

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload
}

export function health() {
  return requestJson('/api/health')
}

export function predictSingle(data) {
  return requestJson('/api/predict', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function predictBulk(urls, model) {
  return requestJson('/api/bulk-predict', {
    method: 'POST',
    body: JSON.stringify({ urls, model }),
  })
}

export async function uploadBulkFile(file, model) {
  const form = new FormData()
  form.append('file', file)
  form.append('model', model)

  const response = await fetch('/api/bulk-predict/file', {
    method: 'POST',
    body: form,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : { error: await response.text() }

  if (!response.ok) throw new Error(payload.error || 'Upload failed')
  return payload
}

export function compareModels() {
  return requestJson('/api/compare')
}

export function startTraining(model_name) {
  return requestJson('/api/train', {
    method: 'POST',
    body: JSON.stringify({ model_name }),
  })
}

export function trainingStatus() {
  return requestJson('/api/train/status')
}

export function getScanHistory(limit = 50) {
  const q = new URLSearchParams({ limit: String(limit) })
  return requestJson(`/api/history?${q.toString()}`)
}

export function getDatasetSyncStatus(limit = 100) {
  const q = new URLSearchParams({ limit: String(limit) })
  return requestJson(`/api/dataset-sync?${q.toString()}`)
}

export function syncUrlhausFeed() {
  return requestJson('/api/dataset-sync/urlhaus', {
    method: 'POST',
  })
}
