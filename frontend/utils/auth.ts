/**
 * 認証関連のユーティリティ関数
 * Django認証への移行に伴うトークン管理の統一
 */

// 統一されたトークンキー名
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_EMAIL: 'userEmail',
  USER_ID: 'uid',
  USER_ROLE: 'userRole',
} as const;

// レガシーのFirebaseトークンキー名（削除対象）
export const LEGACY_TOKEN_KEYS = {
  TOKEN: 'token',
  // 他にもレガシーキーがあれば追加
} as const;

/**
 * アクセストークンを取得
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * リフレッシュトークンを取得
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * ユーザー情報を取得
 */
export const getUserInfo = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    email: localStorage.getItem(TOKEN_KEYS.USER_EMAIL),
    uid: localStorage.getItem(TOKEN_KEYS.USER_ID),
    role: localStorage.getItem(TOKEN_KEYS.USER_ROLE),
  };
};

/**
 * 認証トークンを保存
 */
export const setAuthTokens = (tokens: {
  access: string;
  refresh: string;
  userEmail?: string;
  uid?: string;
  role?: string;
}) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.access);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refresh);
  
  if (tokens.userEmail) {
    localStorage.setItem(TOKEN_KEYS.USER_EMAIL, tokens.userEmail);
  }
  if (tokens.uid) {
    localStorage.setItem(TOKEN_KEYS.USER_ID, tokens.uid);
  }
  if (tokens.role) {
    localStorage.setItem(TOKEN_KEYS.USER_ROLE, tokens.role);
  }
};

/**
 * すべての認証データをクリア
 */
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  
  // 新しいトークンキーをクリア
  Object.values(TOKEN_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // レガシートークンキーもクリア
  Object.values(LEGACY_TOKEN_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Redux persistの状態もクリア
  localStorage.removeItem('persist:root');
};

/**
 * 認証ヘッダーを取得
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * 認証状態をチェック
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const email = getUserInfo()?.email;
  return !!(token && email);
};

/**
 * レガシートークンから新しいトークン形式に移行
 */
export const migrateLegacyTokens = () => {
  if (typeof window === 'undefined') return;
  
  // 古い 'token' キーから 'access_token' に移行
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEYS.TOKEN);
  if (legacyToken && !localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)) {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, legacyToken);
    localStorage.removeItem(LEGACY_TOKEN_KEYS.TOKEN);
    console.log('🔄 Legacy token migrated to access_token');
  }
};

/**
 * デバッグ用：現在のトークン状態を表示
 */
export const debugTokenState = () => {
  if (typeof window === 'undefined') return;
  
  console.group('🔐 Token Debug Info');
  console.log('Access Token:', getAccessToken() ? '✅ Present' : '❌ Missing');
  console.log('Refresh Token:', getRefreshToken() ? '✅ Present' : '❌ Missing');
  console.log('User Info:', getUserInfo());
  console.log('Is Authenticated:', isAuthenticated());
  
  // レガシートークンの存在チェック
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEYS.TOKEN);
  if (legacyToken) {
    console.warn('⚠️ Legacy token found:', LEGACY_TOKEN_KEYS.TOKEN);
  }
  
  console.groupEnd();
};
