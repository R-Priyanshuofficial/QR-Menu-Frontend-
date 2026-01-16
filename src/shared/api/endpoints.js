import api from './axios'

// Auth endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
}

// Staff endpoints (owner/admin only)
export const staffAPI = {
  list: () => api.get('/staff'),
  create: (staffData) => api.post('/staff', staffData),
  update: (id, staffData) => api.put(`/staff/${id}`, staffData),
  remove: (id) => api.delete(`/staff/${id}`),
}

// Menu endpoints
export const menuAPI = {
  getPublicMenu: (menuSlug, token) => api.get(`/menu/${menuSlug}`, { params: { token } }),
  getOwnerMenu: () => api.get('/menu/owner'),
  uploadMenu: (formData) => api.post('/menu/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateMenu: (menuData) => api.put('/menu', menuData),
  publishMenu: () => api.post('/menu/publish'),
  addItem: (itemData) => api.post('/menu/items', itemData),
  updateItem: (itemId, itemData) => api.put(`/menu/items/${itemId}`, itemData),
  deleteItem: (itemId) => api.delete(`/menu/items/${itemId}`),
  deleteAllItems: () => api.delete('/menu/items'),
}

// Orders endpoints
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  getCustomerOrders: (phone) => api.get(`/orders/customer/${phone}`),
  getOwnerOrders: (status) => api.get('/orders/owner/list', { params: { status } }),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
  markOrderReady: (orderId) => api.put(`/orders/${orderId}/ready`),
  markOrderCompleted: (orderId) => api.put(`/orders/${orderId}/complete`),
}

// QR Code endpoints
export const qrAPI = {
  generate: (qrData) => api.post('/qr/generate', qrData),
  getAll: () => api.get('/qr'),
  getOne: (qrId) => api.get(`/qr/${qrId}`),
  delete: (qrId) => api.delete(`/qr/${qrId}`),
  trackScan: (token) => api.post(`/qr/scan/${token}`),
  getAvatars: () => api.get('/qr/avatars'),
}

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
  getQRSummary: () => api.get('/dashboard/qr-summary'),
}

// Analytics endpoints
export const analyticsAPI = {
  getStats: (period, startDate, endDate) => api.get('/analytics/stats', { 
    params: { period, startDate, endDate } 
  }),
  getOrderHistory: (page, limit) => api.get('/analytics/orders', { params: { page, limit } }),
  getPopularItems: () => api.get('/analytics/popular-items'),
}

// Inventory endpoints
export const inventoryAPI = {
  list: () => api.get('/inventory'),
  add: (itemData) => api.post('/inventory', itemData),
  update: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  delete: (id) => api.delete(`/inventory/${id}`),
}

// QR Design endpoints (AI)
export const qrDesignAPI = {
  generateDesigns: (designParams) => api.post('/qr/generate-designs', designParams),
}

export default {
  auth: authAPI,
  staff: staffAPI,
  menu: menuAPI,
  orders: ordersAPI,
  qr: qrAPI,
  dashboard: dashboardAPI,
  analytics: analyticsAPI,
  inventory: inventoryAPI,
  qrDesign: qrDesignAPI,
}
