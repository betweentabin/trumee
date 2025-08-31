/**
 * API v2 認証システム用のカスタムフック
 * Redux状態とAPI v2クライアントを統合
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
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
      
      // API クライアントにトークンを設定（JWTトークンを使用）
      apiV2Client.setToken(data.token);
      
      toast.success('ログインしました');
      
      // ロール別のリダイレクト
      if (data.user.role === 'company') {
        router.push('/company/dashboard');
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
      router.push('/company/dashboard');
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
  const { 
    data: userProfile, 
    refetch: refetchProfile 
  } = useUserProfile({
    enabled: isAuthenticated && !!authTokens.drfToken,
    onSuccess: (data) => {
      // プロフィール情報が更新された場合はRedux状態も更新
      if (currentUser && data.id === currentUser.id) {
        dispatch(updateUser(data));
      }
    },
  });

  // 初期化: ページリロード時のトークン復元
  const initializeAuth = useCallback(() => {
    const storedToken = localStorage.getItem('auth_token_v2');
    const storedDrfToken = localStorage.getItem('drf_token_v2');
    
    if (storedToken && storedDrfToken) {
      dispatch(setTokens({
        token: storedToken,
        drfToken: storedDrfToken,
      }));
      
      // JWTトークンを使用
      apiV2Client.setToken(storedToken);
      
      // ユーザー情報を取得
      refetchProfile();
    }
  }, [dispatch, refetchProfile]);

  // トークン保存
  useEffect(() => {
    if (authTokens.token && authTokens.drfToken) {
      localStorage.setItem('auth_token_v2', authTokens.token);
      localStorage.setItem('drf_token_v2', authTokens.drfToken);
    } else {
      localStorage.removeItem('auth_token_v2');
      localStorage.removeItem('drf_token_v2');
    }
  }, [authTokens]);

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
  const requireAuth = useCallback((redirectTo = '/auth/login') => {
    if (!checkAuth()) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [checkAuth, router]);

  // ロール別のアクセス制御
  const hasRole = useCallback((role: string) => {
    return currentUser?.role === role;
  }, [currentUser]);

  const requireRole = useCallback((role: string, redirectTo = '/') => {
    if (!checkAuth() || !hasRole(role)) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [checkAuth, hasRole, router]);

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
    refetchProfile,
    
    // API状態
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerUserMutation.isPending || registerCompanyMutation.isPending,
    
    // プロフィールデータ
    userProfile,
  };
};

export default useAuthV2;
