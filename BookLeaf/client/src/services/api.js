const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('leafdesk_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getMe: () => request('/auth/me'),
  getDemoUsers: () => request('/auth/demo-users'),

  getMyBooks: (params = {}) => {
    if (typeof params === 'string') {
      return request(`/books/my-books?authorId=${params}`);
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const q = query.toString();
    return request(`/books/my-books${q ? `?${q}` : ''}`);
  },
  getAllBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/books${query ? `?${query}` : ''}`);
  },

  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const q = params.toString();
    return request(`/tickets${q ? `?${q}` : ''}`);
  },
  getTicket: (id) => request(`/tickets/${id}`),
  createTicket: (data) =>
    request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  sendMessage: (id, { content, statusChange, attachments }) =>
    request(`/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, statusChange, attachments })
    }),
  updateStatus: (id, status) =>
    request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  overrideClassification: (id, { category, priority }) =>
    request(`/tickets/${id}/classification`, {
      method: 'PATCH',
      body: JSON.stringify({ category, priority })
    }),
  addInternalNote: (id, note) =>
    request(`/tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),
  assignTicket: (id, { adminId, name, email } = {}) =>
    request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ adminId, name, email })
    }),
  generateDraft: (id) =>
    request(`/tickets/${id}/generate-draft`, {
      method: 'POST'
    }),
  regenerateDraft: (id) =>
    request(`/tickets/${id}/regenerate-draft`, {
      method: 'POST'
    }),

  getAdminStats: () => request('/stats/admin'),
  getAuthorStats: () => request('/stats/author')
};
