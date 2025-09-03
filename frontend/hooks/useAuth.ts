import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RootState, AppDispatch } from '@/app/redux/store';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  updateUser,
  clearError 
} from '@/app/redux/authSlice';
// Firebase imports removed - using Django auth only
// import { signOut } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { 
  getAccessToken, 
  setAuthTokens, 
  clearAuthData, 
  isAuthenticated as checkAuthStatus,
  getAuthHeaders as getHeaders,
  migrateLegacyTokens 
} from '@/utils/auth';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Migrate any legacy tokens first
    migrateLegacyTokens();
    
    const token = getAccessToken();
    const userEmail = localStorage.getItem('userEmail');
    const uid = localStorage.getItem('uid');

    if (token && userEmail && !authState.isAuthenticated) {
      // Restore session from localStorage
      dispatch(loginSuccess({
        user: {
          uid: uid || undefined,
          email: userEmail,
          role: 'user', // Default role, should be fetched from backend
        },
        token,
      }));
    }
  }, [dispatch, authState.isAuthenticated]);

  // Login function - Django auth only
  const login = async (email: string, password: string) => {
    dispatch(loginStart());

    try {
      // Authenticate with Django backend only
      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.login), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.tokens) {
        // Store in localStorage (Django format) using utility
        setAuthTokens({
          access: data.tokens.access,
          refresh: data.tokens.refresh,
          userEmail: email,
          uid: data.user?.id,
          role: data.user?.role,
        });

        // Update Redux state
        dispatch(loginSuccess({
          user: {
            uid: data.user?.id,
            email,
            role: data.user?.role || 'user',
            hasResume: data.user?.hasResume,
            name: data.user?.full_name,
          },
          token: data.tokens.access,
        }));

        toast.success('ログインに成功しました');

        // Redirect based on role
        if (data.user?.is_staff || data.user?.is_superuser) {
          // 管理者は管理画面へリダイレクト
          router.push('/admin/seekers');
        } else if (data.user?.role === 'company') {
          router.push('/company');
        } else {
          router.push('/users');
        }

        return { success: true };
      } else {
        throw new Error(data.detail || data.error || 'ログインに失敗しました');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'ログインに失敗しました';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear all auth data using utility
      clearAuthData();
      
      // Clear Redux state
      dispatch(logoutAction());
      
      toast.success('ログアウトしました');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  // Check authentication status
  const checkAuth = () => {
    return checkAuthStatus() && authState.isAuthenticated;
  };

  // Get auth headers
  const getAuthHeaders = () => {
    return getHeaders();
  };

  // Require auth (redirect if not authenticated)
  const requireAuth = (redirectTo: string = '/auth/login') => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (!checkAuth()) {
      router.push(redirectTo);
    }
  };

  // Require guest (redirect if authenticated)
  const requireGuest = (redirectTo: string = '/users') => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (checkAuth()) {
      router.push(redirectTo);
    }
  };

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    getAuthHeaders,
    requireAuth,
    requireGuest,
    updateUser: (userData: any) => dispatch(updateUser(userData)),
    clearError: () => dispatch(clearError()),
  };
};