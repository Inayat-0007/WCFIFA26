import axios from 'axios';

const PRODUCTION_API = 'https://wcfifa26.onrender.com/api';

const getApiUrl = (): string => {
  // In the browser, always use the production API when on a Vercel domain
  // This MUST come first to override any build-time env var baking
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host.includes('wcfifa')) {
      return PRODUCTION_API;
    }
  }
  // For local development or custom domains, use the env var
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:4000/api';
};

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  // Dynamically resolve the API URL in the browser at runtime
  config.baseURL = getApiUrl();

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wcf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wcf_token');
        localStorage.removeItem('wcf_user');
        // Only redirect if not already on auth pages
        const path = window.location.pathname;
        if (!path.startsWith('/login') && !path.startsWith('/signup') && path !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
