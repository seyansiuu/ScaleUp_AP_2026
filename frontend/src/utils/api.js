/**
 * ScaleUp API Client
 * Coordinates with the backend Express REST API at /api/v1
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('scaleup_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError('Unable to connect to the server. Please check if the backend is running.', 0);
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // If 401 Unauthorized, dispatch auth error event so UI can redirect
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('scaleup:unauthorized'));
    }

    let message = 'An error occurred';
    if (typeof data === 'object' && data !== null) {
      if (data.message) {
        message = data.message;
      }
      if (data.errors && Array.isArray(data.errors)) {
        message = data.errors.map(e => `${e.path}: ${e.message}`).join(', ');
      }
    } else if (typeof data === 'string' && data) {
      message = data;
    }

    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  async register({ name, email, password }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Startups
  async getStartups() {
    return request('/startups', { method: 'GET' });
  },

  async createStartup({ name, seed }) {
    const payload = { name };
    if (seed !== undefined && seed !== null && seed !== '') {
      payload.seed = parseInt(seed, 10);
    }
    return request('/startups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getStartup(id) {
    return request(`/startups/${id}`, { method: 'GET' });
  },

  // ─── Employees ────────────────────────────────────────────────────────
  async getEmployees(startupId) {
    return request(`/startups/${startupId}/employees`, { method: 'GET' });
  },

  async addEmployee(startupId, payload) {
    return request(`/startups/${startupId}/employees`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async fireEmployee(startupId, employeeId) {
    return request(`/startups/${startupId}/employees/${employeeId}`, {
      method: 'DELETE',
    });
  },

  // Turn advance (idempotent, row-locked on backend)
  async advanceTurn(id, decisions, customKey = null) {
    const idempotencyKey = customKey || (crypto.randomUUID ? crypto.randomUUID() : `turn-${Date.now()}-${Math.random()}`);
    return request(`/startups/${id}/turns`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(decisions),
    });
  },

  async getHealth() {
    return request('/health', { method: 'GET' });
  },
};
