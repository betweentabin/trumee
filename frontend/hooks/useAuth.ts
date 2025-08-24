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
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('access_token');
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
        // Store in localStorage (Django format)
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('userEmail', email);
        if (data.user?.id) {
          localStorage.setItem('uid', data.user.id);
        }

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

        // Redirect based on role and status
        if (data.user?.role === 'company') {
          router.push('/company');
        } else if (data.user?.hasResume) {
          router.push('/users');
        } else {
          router.push('/auth/step/step1-profile');
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
      // Clear localStorage only (no Firebase signout needed)
      localStorage.removeItem('access_token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('uid');
      
      // Clear Redux state
      dispatch(logoutAction());
      
      // Clear persisted state
      localStorage.removeItem('persist:root');
      
      toast.success('ログアウトしました');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  // Check authentication status
  const checkAuth = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token && authState.isAuthenticated;
  };

  // Get auth headers
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = authState.token || localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Require auth (redirect if not authenticated)
  const requireAuth = (redirectTo: string = '/auth/login') => {
    useEffect(() => {
      if (!checkAuth()) {
        router.push(redirectTo);
      }
    }, [authState.isAuthenticated]);
  };

  // Require guest (redirect if authenticated)
  const requireGuest = (redirectTo: string = '/users') => {
    useEffect(() => {
      if (checkAuth()) {
        router.push(redirectTo);
      }
    }, [authState.isAuthenticated]);
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