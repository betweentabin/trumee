// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://trumee-production.up.railway.app' : 'http://localhost:8000'),
  API_VERSION: '/api/v2',  // Updated to v2
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  
  endpoints: {
    // Authentication (API v2)
    login: '/auth/login/',
    register: '/auth/register-user/', // Added missing register endpoint
    registerUser: '/auth/register-user/',
    registerCompany: '/auth/register-company/',
    logout: '/auth/logout/',
    refreshToken: '/auth/token/refresh/',
    verifyToken: '/auth/token/verify/',
    
    // User Profile
    userProfile: '/user/profile/',
    
    // Seeker Profiles
    seekerProfiles: '/seeker-profiles/',
    seekerProfileDetail: (id: string) => `/seeker-profiles/${id}/`,
    
    // Resumes
    resumes: '/resumes/',
    resumeDetail: (id: string) => `/resumes/${id}/`,
    resumeActivate: (id: string) => `/resumes/${id}/activate/`,
    
    // Experiences
    experiences: '/experiences/',
    experienceDetail: (id: string) => `/experiences/${id}/`,
    
    // Applications
    applications: '/applications/',
    applicationDetail: (id: string) => `/applications/${id}/`,
    applicationUpdateStatus: (id: string) => `/applications/${id}/update_status/`,
    
    // Scouts
    scouts: '/scouts/',
    scoutDetail: (id: string) => `/scouts/${id}/`,
    scoutMarkViewed: (id: string) => `/scouts/${id}/mark_viewed/`,
    scoutRespond: (id: string) => `/scouts/${id}/respond/`,
    
    // Messages
    messages: '/messages/',
    messageDetail: (id: string) => `/messages/${id}/`,
    messageMarkRead: (id: string) => `/messages/${id}/mark_read/`,
    messageUnreadCount: '/messages/unread_count/',
    
    // Payments
    payments: '/payments/',
    paymentDetail: (id: string) => `/payments/${id}/`,
    paymentSetDefault: (id: string) => `/payments/${id}/set_default/`,
    stripeCheckout: '/payments/checkout/',
    
    // Search
    searchSeekers: '/search/seekers/',
    searchCompanies: '/search/companies/',
    
    // Company
    companyDetail: (id: string) => `/companies/${id}/`,
    
    // Dashboard
    dashboardStats: '/dashboard/stats/',
    
    // Admin
    adminSeekers: '/admin/seekers/',
    adminUsers: '/admin/users/',
    
    // Form persistence endpoints
    saveHistory: '/seeker/history/',
    saveResume: '/seeker/resume/',
    getHistory: '/seeker/history/',
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  // Handle undefined or null endpoint
  if (!endpoint) {
    console.error('buildApiUrl called with undefined or null endpoint');
    return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/`;
  }
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Check if the endpoint already includes /api/v2
  if (cleanEndpoint.includes('/api/v2')) {
    return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
  }
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${cleanEndpoint}`;
};

// Build full URL with dynamic params
export const buildDynamicApiUrl = (endpointFn: (id: string) => string, id: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpointFn(id)}`;
};

// Common headers for API requests (DRF Token認証形式)
export const getApiHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;  // DRF Token認証形式に変更
  }
  
  return headers;
};

// Error response type
export interface ApiError {
  message?: string;
  detail?: string;
  error?: string;
  [key: string]: any;
}

// Standardized error handler
export const handleApiError = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    return data.detail || data.message || data.error || 'エラーが発生しました';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'ネットワークエラーが発生しました';
};

// API response type helpers
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: any;
  tokens: TokenResponse;
}
