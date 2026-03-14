import axios from 'axios';

const api = axios.create({
  // In dev, Vite proxies /api → localhost:5000. In production, /api is served directly.
  baseURL: '/api',
  timeout: 30000, // 30s timeout to catch hangs
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
