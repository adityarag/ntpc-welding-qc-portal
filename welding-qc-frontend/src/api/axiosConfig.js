import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for global error transformation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Transform backend errors into safe, user-friendly messages
    let customError = new Error('An unexpected network error occurred.');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const serverMessage = error.response.data?.message;

      if (status === 401) {
        customError.message = 'Authentication failed. Please check your credentials or log in again.';
        // Optionally trigger a global logout event here
      } else if (status === 403) {
        customError.message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        customError.message = 'The requested resource could not be found.';
      } else if (status === 400) {
        customError.message = serverMessage || 'Invalid request. Please check your inputs.';
      } else if (status >= 500) {
        customError.message = 'A server error occurred. Please try again later.';
      } else {
        customError.message = serverMessage || 'An error occurred while processing your request.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      customError.message = 'Cannot connect to the server. Please check your internet connection.';
    }

    return Promise.reject(customError);
  }
);

export default api;
