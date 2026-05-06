import axios from 'axios';

const API_BASE = '/backend';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('aura_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || 'Something went wrong';
    return Promise.reject({ message: msg, status: err.response?.status });
  }
);

export const menuAPI = {
  getAll: () => api.get('/menu'),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const categoryAPI = {
  getAll: (all = false) => api.get(`/categories${all ? '?all=1' : ''}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (status) => api.get(`/orders${status ? `?status=${status}` : ''}`),
  updateStatus: (id, status, prepared_by = null) => api.patch(`/orders/${id}`, { status, prepared_by }),
  getStats: () => api.get('/orders/stats'),
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
};

export const tablesAPI = {
  getAll: () => api.get('/tables'),
};

export default api;
