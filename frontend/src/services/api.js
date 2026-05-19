import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api/`;
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
});

// Create a separate instance for health checks that doesn't have the auth interceptors
export const healthApi = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If there is no response (e.g. timeout or network error)
    if (!error.response) {
      console.warn('Network error: Server unreachable at', API_URL);
      return Promise.reject(error);
    }

    const isLoginRequest = originalRequest.url.includes('auth/login');
    const isRefreshRequest = originalRequest.url.includes('auth/refresh');

    // Only attempt refresh if it's a 401 and not already a retry or a login/refresh request
    if (error.response.status === 401 && !originalRequest._retry && !isLoginRequest && !isRefreshRequest) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_URL}users/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout user if refresh fails
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        
        // Define public pages that don't require redirect on session expiry
        const publicPages = ['/', '/find-doctors', '/find-labs', '/find-tests', '/find-clinics', '/login', '/register'];
        const currentPath = window.location.pathname.replace(/\/$/, ''); // Remove trailing slash
        const isPublicPage = publicPages.includes(currentPath || '/');

        if (!isPublicPage) {
          window.location.href = '/';
        } else {
          // If on a public page, just reload to clear any stale auth state in context
          window.location.reload();
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
