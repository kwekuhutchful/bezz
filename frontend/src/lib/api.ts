import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      auth.signOut();
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Brand briefs
  createBrief: '/api/briefs',
  getBrief: (id: string) => `/api/briefs/${id}`,
  listBriefs: '/api/briefs',
  
  // User management
  getProfile: '/api/user/profile',
  updateProfile: '/api/user/profile',
  
  // Payments
  createCheckoutSession: '/api/payments/checkout',
  getSubscription: '/api/payments/subscription',
  
  // Admin
  getMetrics: '/api/admin/metrics',
  getUsers: '/api/admin/users',
} as const; 