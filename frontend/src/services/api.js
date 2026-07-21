import axios from 'axios';
 
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
 
const api = axios.create({
  baseURL: API_URL,
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
 
export const authAPI = {
  register: (username, email, password, branch) =>
    api.post('/auth/register', { username, email, password, branch }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};
 
export const memberAPI = {
  createMember: (data) => api.post('/members', data),
  getAllMembers: (branch) => api.get('/members', { params: { branch } }),
  getMemberByCard: (cardNumber) => api.get(`/members/card/${cardNumber}`),
  updateMember: (id, data) => api.put(`/members/${id}`, data),
  getMemberStats: () => api.get('/members/stats'),
};
 
export const transactionAPI = {
  addTransaction: (data) => {
    if (!data.created_by) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      data.created_by = user.id;
    }
    return api.post('/transactions', data);
  },
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),  // ✅ ADD THIS
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),  // ✅ ADD THIS
};
 
export const dataAPI = {
  exportData: () => api.get('/data/export', { responseType: 'blob' }),
  getBackupHistory: () => api.get('/data/backup-history'),
};
 
export default api;
