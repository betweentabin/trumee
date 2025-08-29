/**
 * API v2 認証状態管理用のReduxスライス
 * 新しいAPIクライアントと連携
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types/api-v2';

interface AuthV2State {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  drfToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthV2State = {
  isAuthenticated: false,
  user: null,
  token: null,
  drfToken: null,
  isLoading: false,
  error: null,
};

const authV2Slice = createSlice({
  name: 'authV2',
  initialState,
  reducers: {
    // ログイン開始
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    // ログイン成功
    loginSuccess: (state, action: PayloadAction<{
      user: User;
      token: string;
      drfToken: string;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.drfToken = action.payload.drfToken;
      state.isLoading = false;
      state.error = null;
    },

    // ログイン失敗
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.drfToken = null;
      state.isLoading = false;
      state.error = action.payload;
    },

    // ユーザー情報更新
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    // ログアウト
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.drfToken = null;
      state.isLoading = false;
      state.error = null;
    },

    // エラークリア
    clearError: (state) => {
      state.error = null;
    },

    // トークン設定（ページリロード時の復元用）
    setTokens: (state, action: PayloadAction<{
      token: string;
      drfToken: string;
    }>) => {
      state.token = action.payload.token;
      state.drfToken = action.payload.drfToken;
      state.isAuthenticated = true;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  updateUser,
  logout,
  clearError,
  setTokens,
} = authV2Slice.actions;

export default authV2Slice.reducer;

// セレクター
export const selectAuthV2 = (state: { authV2: AuthV2State }) => state.authV2;
export const selectIsAuthenticated = (state: { authV2: AuthV2State }) => state.authV2.isAuthenticated;
export const selectCurrentUser = (state: { authV2: AuthV2State }) => state.authV2.user;
export const selectAuthTokens = (state: { authV2: AuthV2State }) => ({
  token: state.authV2.token,
  drfToken: state.authV2.drfToken,
});
export const selectAuthLoading = (state: { authV2: AuthV2State }) => state.authV2.isLoading;
export const selectAuthError = (state: { authV2: AuthV2State }) => state.authV2.error;
