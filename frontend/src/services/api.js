const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getDashboardCharts() {
    const res = await fetch(`${API_BASE}/dashboard/charts`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getRecentActivity() {
    const res = await fetch(`${API_BASE}/dashboard/recent-activity`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Ingestion / Uploads
  async getUploadStatus() {
    const res = await fetch(`${API_BASE}/upload/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async uploadLocations(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/locations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    return handleResponse(res);
  },

  async uploadSystemA(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/system-a`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    return handleResponse(res);
  },

  async uploadSystemB(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/system-b`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    return handleResponse(res);
  },

  async loadSampleDatasets() {
    const res = await fetch(`${API_BASE}/upload/load-sample-datasets`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Records Explorer
  async getLocations() {
    const res = await fetch(`${API_BASE}/records/locations`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getSystemARecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/records/system-a?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getSystemBRecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/records/system-b?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Reconciliation
  async runReconciliation(notes = 'Manual Run via Dashboard') {
    const res = await fetch(`${API_BASE}/reconciliation/run?notes=${encodeURIComponent(notes)}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getReconciliationResults(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reconciliation/results?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Exceptions
  async getExceptions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/exceptions?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getExceptionStats() {
    const res = await fetch(`${API_BASE}/exceptions/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async reviewException(id, payload) {
    const res = await fetch(`${API_BASE}/exceptions/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Reports Export URLs
  getExportCsvUrl() {
    return `${API_BASE}/reports/export/csv`;
  },

  getExportExcelUrl() {
    return `${API_BASE}/reports/export/excel`;
  }
};

