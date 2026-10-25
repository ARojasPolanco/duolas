import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    const isAuthEndpoint = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].some((path) => url.includes(path));

    const publicAuthPaths = [
      '/',
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/terminos',
      '/privacidad',
    ];
    const onPublicAuthPage = publicAuthPaths.includes(window.location.pathname);

    const suspended = status === 403 && message.toLowerCase().includes('suspendida');

    if ((status === 401 && !isAuthEndpoint) || suspended) {
      if (suspended) {
        sessionStorage.setItem(
          'flashMessage',
          message || 'Tu cuenta está suspendida. Contactá a soporte.'
        );
      }

      localStorage.removeItem('token');
      localStorage.removeItem('duo_user');

      if (!onPublicAuthPage) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
