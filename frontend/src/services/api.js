const API_BASE = '/api';

/**
 * Helper to make JSON API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach appropriate token (Admin or User)
  const adminToken = localStorage.getItem('pay_unlock_admin_token');
  const userToken = localStorage.getItem('pay_unlock_user_token');

  if (!headers['Authorization']) {
    if (endpoint.startsWith('/admin') && adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    } else if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    } else if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    // When using FormData, let browser set the multipart boundary
    delete headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Public Media
  getMediaList: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return apiRequest(`/media?${query.toString()}`);
  },

  getMediaById: (idOrSlug) => apiRequest(`/media/${idOrSlug}`),

  // User Authentication (Name + 8-Digit Password)
  userAuthEntry: ({ name, password }) => apiRequest('/user-auth/entry', {
    method: 'POST',
    body: { name, password }
  }),

  getCurrentUser: () => apiRequest('/user-auth/me'),
  createCheckoutOrder: (mediaId) => {
    // Anonymous session token from browser session
    let customerSessionId = sessionStorage.getItem('anon_session_id');
    if (!customerSessionId) {
      customerSessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('anon_session_id', customerSessionId);
    }
    return apiRequest('/payments/create-order', {
      method: 'POST',
      body: { mediaId, customerSessionId }
    });
  },

  verifyPayment: (paymentData) => apiRequest('/payments/verify', {
    method: 'POST',
    body: paymentData
  }),

  verifyDirectPayment: (paymentData) => apiRequest('/payments/verify-direct-link', {
    method: 'POST',
    body: paymentData
  }),

  // Submit UPI UTR for Admin Verification (Photo stays LOCKED until Admin approves)
  submitUtrPayment: (payload) => apiRequest('/payments/submit-utr', {
    method: 'POST',
    body: payload
  }),

  // Check verification/approval status of an order
  checkOrderStatus: (orderId) => apiRequest(`/payments/status/${orderId}`),

  // Protected Access & Stream Authorization
  requestMediaAccess: (mediaId, { purchaseToken, recoveryCode }) => apiRequest(`/media/${mediaId}/access`, {
    method: 'POST',
    body: { purchaseToken, recoveryCode }
  }),

  checkAccessStatus: (mediaId, { token, code }) => {
    const query = new URLSearchParams({ mediaId });
    if (token) query.append('token', token);
    if (code) query.append('code', code);
    return apiRequest(`/purchases/status?${query.toString()}`);
  },

  recoverAccess: (payload) => apiRequest('/purchases/recover', {
    method: 'POST',
    body: payload
  }),

  getMyLibrary: ({ tokens, recoveryCodes }) => apiRequest('/purchases/my-library', {
    method: 'POST',
    body: { tokens, recoveryCodes }
  }),

  // Contact & Support
  submitContact: (formData) => apiRequest('/contact', {
    method: 'POST',
    body: formData
  }),

  // Admin
  adminLogin: (usernameOrEmail, password) => apiRequest('/admin/auth/login', {
    method: 'POST',
    body: { username: usernameOrEmail, email: usernameOrEmail, password }
  }),

  getDashboardStats: () => apiRequest('/admin/dashboard/stats'),
  getAdminMedia: () => apiRequest('/admin/media'),
  createAdminMedia: (formData) => apiRequest('/admin/media', {
    method: 'POST',
    body: formData
  }),
  updateAdminMedia: (id, data) => apiRequest(`/admin/media/${id}`, {
    method: 'PUT',
    body: data
  }),
  deleteAdminMedia: (id) => apiRequest(`/admin/media/${id}`, {
    method: 'DELETE'
  }),
  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams(params);
    return apiRequest(`/admin/orders?${query.toString()}`);
  },
  approveAdminOrder: (orderId) => apiRequest(`/admin/orders/${orderId}/approve`, {
    method: 'POST'
  }),
  rejectAdminOrder: (orderId, reason = '') => apiRequest(`/admin/orders/${orderId}/reject`, {
    method: 'POST',
    body: { reason }
  }),
  refundAdminOrder: (orderId) => apiRequest(`/admin/orders/${orderId}/refund`, {
    method: 'POST'
  }),
  getAdminMessages: () => apiRequest('/contact/messages'),
  syncImagesFolder: () => apiRequest('/admin/sync-folder', {
    method: 'POST'
  })
};

export const RAZORPAY_ME_LINK = 'https://razorpay.me/@ravirahul601';
export const RAZORPAY_ME_HANDLE = '@ravirahul601';

