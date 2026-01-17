/**
 * API Configuration
 * Change API_BASE_URL in .env file to switch between local and production
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://qr-menu-backend-lwba.onrender.com/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_PROFILE: '/auth/profile',
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_ACTIVITY: '/dashboard/activity',
  DASHBOARD_QR_SUMMARY: '/dashboard/qr-summary',
  
  // QR Codes
  QR_GENERATE: '/qr/generate',
  QR_LIST: '/qr',
  QR_DETAILS: (id) => `/qr/${id}`,
  QR_DELETE: (id) => `/qr/${id}`,
  QR_SCAN: (token) => `/qr/scan/${token}`,
};

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
};
