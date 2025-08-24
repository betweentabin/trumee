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
    const token = localStorage.getItem('token');
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

      if (response.ok && data.token) {
        // Store in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', email);
        if (data.uid) {
          localStorage.setItem('uid', data.uid);
        }

        // Update Redux state
        dispatch(loginSuccess({
          user: {
            uid: data.uid,
            email,
            role: data.role || 'user',
            hasResume: data.hasResume,
            name: data.name,
          },
          token: data.token,
        }));

        toast.success('ログインに成功しました');

        // Redirect based on role and status
        if (data.role === 'company') {
          router.push('/company');
        } else if (data.hasResume) {
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
      localStorage.removeItem('token');
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
    const token = localStorage.getItem('token');
    return !!token && authState.isAuthenticated;
  };

  // Get auth headers
  const getAuthHeaders = () => {
    const token = authState.token || localStorage.getItem('token');
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