const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const customFetch = async (endpoint, options = {}) => {
  const url = `${baseURL.replace(/\/api$/, '')}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const error = new Error(data?.message || 'Request failed');
      error.response = { data, status: response.status };
      throw error;
    }

    return { data, status: response.status, headers: response.headers };
  } catch (error) {
    throw error;
  }
};

const api = {
  get: (url, config = {}) => customFetch(url, { ...config, method: 'GET' }),
  post: (url, data, config = {}) => customFetch(url, { ...config, method: 'POST', body: JSON.stringify(data) }),
  put: (url, data, config = {}) => customFetch(url, { ...config, method: 'PUT', body: JSON.stringify(data) }),
  delete: (url, config = {}) => customFetch(url, { ...config, method: 'DELETE' }),
};

export default api;
