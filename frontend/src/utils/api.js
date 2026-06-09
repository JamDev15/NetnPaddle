const BASE = '/api'

function adminHeaders() {
  const token = localStorage.getItem('adminToken')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('adminToken')
    window.location.href = '/admin/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  get: (path) => fetch(BASE + path).then(handleResponse),
  post: (path, data) =>
    fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  adminGet: (path) =>
    fetch(BASE + path, { headers: adminHeaders() }).then(handleResponse),
  adminPost: (path, data) =>
    fetch(BASE + path, { method: 'POST', headers: adminHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  adminPut: (path, data) =>
    fetch(BASE + path, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  adminDelete: (path) =>
    fetch(BASE + path, { method: 'DELETE', headers: adminHeaders() }).then(handleResponse),
}
