// Path: frontend/src/services/api.js

import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Log để debug
console.log('API Base URL:', import.meta.env.VITE_API_URL);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response);
    if (error.response?.status === 401) {
      message.error('Phiên đăng nhập hết hạn');
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    } else if (error.response?.status === 403) {
      message.error('Bạn không có quyền thực hiện thao tác này');
    } else if (error.response?.status === 500) {
      message.error('Lỗi server, vui lòng thử lại sau');
    }
    return Promise.reject(error);
  }
);

export default api;