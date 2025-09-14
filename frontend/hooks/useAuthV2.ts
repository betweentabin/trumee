/**
 * API v2 認証システム用のカスタムフック
 * Redux状態とAPI v2クライアントを統合
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  updateUser,
  setTokens,
  selectAuthV2,
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthTokens,
  selectAuthLoading,
  selectAuthError,
} from '@/app/redux/authV2Slice';
import apiV2Client from '@/lib/api-v2-client';
import { 
  useLogin, 
  useRegisterUser, 
  useRegisterCompany, 
  useUserProfile,
  useLogout as useApiLogout
} from '@/hooks/useApiV2';
import { LoginRequest, RegisterUserRequest, RegisterCompanyRequest } from '@/types/api-v2';

export const useAuthV2 = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Redux State
  const authState = useSelector(selectAuthV2);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const authTokens = useSelector(selectAuthTokens);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // API Mutations
  const loginMutation = useLogin({
    onSuccess: (data) => {
      dispatch(loginSuccess({
        user: data.user,
        token: data.token,
        drfToken: data.drf_token,
      }));
      // 永続化
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_user_v2', JSON.stringify(data.user));
      }
      
      // API クライアントにトークンを設定（DRFトークンを使用）
      apiV2Client.setToken(data.drf_token);
      
      toast.success('ログインしました');
      
      // ロール別のリダイレクト
      if (data.user.is_staff || data.user.is_superuser) {
        // 管理者は管理画面へリダイレクト
        router.push('/admin/seekers');
      } else if (data.user.role === 'company') {
        router.push(`/company/${data.user.id}`);
      } else {
        router.push('/users');
      }
    },
    onError: (error: any) => {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'ログインに失敗しました';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    },
  });

  const registerUserMutation = useRegisterUser({
    onSuccess: (data) => {
      dispatch(loginSuccess({
        user: data.user,
        token: data.token,
        drfToken: data.drf_token,
      }));
      
      apiV2Client.setToken(data.drf_token);
      toast.success('ユーザー登録が完了しました');
      router.push('/auth/step/step1-profile');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'ユーザー登録に失敗しました';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    },
  });

  const registerCompanyMutation = useRegisterCompany({
    onSuccess: (data) => {
      dispatch(loginSuccess({
        user: data.user,
        token: data.token,
        drfToken: data.drf_token,
      }));
      
      apiV2Client.setToken(data.drf_token);
      toast.success('企業登録が完了しました');
      router.push(`/company/${data.user.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || '企業登録に失敗しました';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    },
  });

  const logoutMutation = useApiLogout({
    onSuccess: () => {
      dispatch(logoutAction());
      apiV2Client.clearToken();
      toast.success('ログアウトしました');
      router.push('/');
    },
  });

  // User Profile Query (認証後に自動実行)
  // 🚨 緊急対応: useUserProfile を一時的に無効化（無限ループ防止）
  // const { 
  //   data: userProfile, 
  //   refetch: refetchProfile 
  // } = useUserProfile({
  //   enabled: isAuthenticated && !!authTokens.drfToken,
  //   onSuccess: (data) => {
  //     // プロフィール情報が更新された場合はRedux状態も更新
  //     if (currentUser && data.id === currentUser.id) {
  //       dispatch(updateUser(data));
  //     }
  //   },
  // });

  // 一時的なダミー関数
  const userProfile = null;
  const refetchProfile = () => Promise.resolve();

  // 初期化: ページリロード時のトークン復元
  const initializeAuth = useCallback(() => {
    console.log('🔧 initializeAuth called', { isAuthenticated, hasToken: !!localStorage.getItem('drf_token_v2') });
    
    const storedDrfToken = localStorage.getItem('drf_token_v2');
    const storedUser = localStorage.getItem('current_user_v2');
    
    if (storedDrfToken && !isAuthenticated) {
      console.log('🔧 Restoring auth tokens');
      dispatch(setTokens({
        token: storedDrfToken,  // DRFトークンを両方に設定
        drfToken: storedDrfToken,
      }));
      
      // DRFトークンを使用
      apiV2Client.setToken(storedDrfToken);
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          dispatch(updateUser(user));
        } catch {}
      }
    } else {
      console.log('🔧 Skip auth initialization', { 
        hasStoredDrfToken: !!storedDrfToken, 
        isAuthenticated 
      });
    }
  }, [dispatch, isAuthenticated]);

  // 認証状態変化時にプロフィールを取得
  useEffect(() => {
    if (isAuthenticated && authTokens.drfToken && !currentUser) {
      console.log('🔧 Auth state changed, fetching profile');
      refetchProfile();
    }
  }, [isAuthenticated, authTokens.drfToken, currentUser, refetchProfile]);

  // トークン保存（DRFトークンのみ使用）
  useEffect(() => {
    if (authTokens.drfToken) {
      localStorage.setItem('drf_token_v2', authTokens.drfToken);
      // 後方互換性のためauth_token_v2にも保存
      localStorage.setItem('auth_token_v2', authTokens.drfToken);
      if (currentUser) {
        localStorage.setItem('current_user_v2', JSON.stringify(currentUser));
      }
    } else {
      localStorage.removeItem('drf_token_v2');
      localStorage.removeItem('auth_token_v2');
      localStorage.removeItem('current_user_v2');
    }
  }, [authTokens, currentUser]);

  // 公開メソッド
  const login = useCallback((credentials: LoginRequest) => {
    dispatch(loginStart());
    loginMutation.mutate(credentials);
  }, [dispatch, loginMutation]);

  const registerUser = useCallback((userData: RegisterUserRequest) => {
    dispatch(loginStart());
    registerUserMutation.mutate(userData);
  }, [dispatch, registerUserMutation]);

  const registerCompany = useCallback((companyData: RegisterCompanyRequest) => {
    dispatch(loginStart());
    registerCompanyMutation.mutate(companyData);
  }, [dispatch, registerCompanyMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const checkAuth = useCallback(() => {
    return isAuthenticated && !!authTokens.token;
  }, [isAuthenticated, authTokens.token]);

  // 認証が必要なページでの認証チェック
  const hasStoredToken = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('drf_token_v2');
  };

  const requireAuth = useCallback((redirectTo = '/auth/login') => {
    if (!checkAuth()) {
      if (hasStoredToken()) {
        // トークン復元中はリダイレクトせず待機
        initializeAuth();
        return false;
      }
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [checkAuth, router, initializeAuth]);

  // ロール別のアクセス制御
  const hasRole = useCallback((role: string) => {
    return currentUser?.role === role;
  }, [currentUser]);

  // 管理者判定（is_staff または is_superuser）
  const isAdmin = useCallback(() => {
    return !!(currentUser && ((currentUser as any).is_staff || (currentUser as any).is_superuser));
  }, [currentUser]);

  const requireAdmin = useCallback((redirectTo = '/') => {
    if (!checkAuth() || !isAdmin()) {
      if (hasStoredToken()) {
        initializeAuth();
        return false;
      }
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [checkAuth, isAdmin, router, initializeAuth]);

  const requireRole = useCallback((role: string, redirectTo = '/') => {
    if (!checkAuth() || !hasRole(role)) {
      if (hasStoredToken()) {
        initializeAuth();
        return false;
      }
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [checkAuth, hasRole, router, initializeAuth]);

  return {
    // 状態
    authState,
    isAuthenticated,
    currentUser,
    isLoading: isLoading || loginMutation.isPending || registerUserMutation.isPending || registerCompanyMutation.isPending,
    error,
    
    // アクション
    login,
    registerUser,
    registerCompany,
    logout,
    initializeAuth,
    
    // ユーティリティ
    checkAuth,
    requireAuth,
    hasRole,
    requireRole,
    isAdmin,
    requireAdmin,
    refetchProfile,
    
    // API状態
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerUserMutation.isPending || registerCompanyMutation.isPending,
    
    // プロフィールデータ
    userProfile,
  };
};

export default useAuthV2;
