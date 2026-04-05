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
