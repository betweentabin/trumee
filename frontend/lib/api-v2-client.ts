/**
 * API v2 クライアント
 * 新しいデータベーススキーマに対応したAPIクライアント
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  User, SeekerProfile, CompanyProfile, Resume, Experience, Education, Certification,
  Application, Scout, Message, DashboardStats, ResumeCompletenessCheck,
  LoginRequest, LoginResponse, RegisterUserRequest, RegisterCompanyRequest,
  SearchSeekersRequest, SearchSeekersResponse, CreateResumeRequest, UpdateResumeRequest,
  CreateApplicationRequest, CreateScoutRequest, ApiResponse, ApiError, API_ENDPOINTS,
  CompanyMonthlyPage
} from '@/types/api-v2';

// ============================================================================
// APIクライアント設定
// ============================================================================

class ApiV2Client {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'https://trumee-production.up.railway.app') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

      // リクエストインターセプター：認証トークンを自動付与
  this.client.interceptors.request.use((config) => {
    const token = this.getToken();
    if (token) {
      // DRFトークン認証に切り替え
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  });

      // レスポンスインターセプター：エラーハンドリングとトークンリフレッシュ
  this.client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      
      // 401エラー（認証失敗）でトークンリフレッシュを試行
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // DRFトークンは期限がないが、何らかの理由で無効になった場合
          // ログアウトして再ログインを促す
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } catch (refreshError) {
          // エラーが発生した場合もログアウト
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }
      
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
  }

  // トークン管理
  setToken(drfToken: string, jwtToken?: string) {
    this.token = drfToken; // DRFトークンを優先
    if (typeof window !== 'undefined') {
      localStorage.setItem('drf_token_v2', drfToken);
      localStorage.setItem('auth_token_v2', drfToken); // 後方互換性のため
      if (jwtToken) {
        localStorage.setItem('jwt_token_v2', jwtToken);
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      // DRFトークンを優先的に取得
      this.token = localStorage.getItem('drf_token_v2') || localStorage.getItem('auth_token_v2');
    }
    return this.token;
  }

  getRefreshToken(): string | null {
    // DRFトークンは期限がないので、リフレッシュは不要
    // JWTトークンがある場合はそれを返す（将来の拡張用）
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token_v2');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drf_token_v2');
      localStorage.removeItem('auth_token_v2');
      localStorage.removeItem('jwt_token_v2');
    }
  }

  // ============================================================================
  // 認証関連API
  // ============================================================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials);
    const { drf_token, token, user } = response.data as any;
    // DRFトークンを優先的に使用
    this.setToken(drf_token, token);
    return response.data;
  }

  async registerUser(userData: RegisterUserRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(API_ENDPOINTS.REGISTER_USER, userData);
    const { drf_token, token } = response.data as any;
    // DRFトークンを優先的に使用
    this.setToken(drf_token, token);
    return response.data;
  }

  async registerCompany(companyData: RegisterCompanyRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(API_ENDPOINTS.REGISTER_COMPANY, companyData);
    const { drf_token, token } = response.data as any;
    // DRFトークンを優先的に使用
    this.setToken(drf_token, token);
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // ============================================================================
  // プロフィール関連API
  // ============================================================================

  async getUserProfile(): Promise<User> {
    const response = await this.client.get<User>(API_ENDPOINTS.USER_PROFILE);
    return response.data;
  }

  // 公開プロフィール（閲覧用）
  async getPublicUserProfile(userId: string) {
    const url = `${API_ENDPOINTS.PUBLIC_USER_BASE}${userId}/`;
    const res = await this.client.get(url);
    return res.data;
  }

  async getSeekerProfiles(): Promise<SeekerProfile[]> {
    const response = await this.client.get<SeekerProfile[]>(API_ENDPOINTS.SEEKER_PROFILES);
    return response.data;
  }

  async createSeekerProfile(profileData: Partial<SeekerProfile>): Promise<SeekerProfile> {
    const response = await this.client.post<SeekerProfile>(API_ENDPOINTS.SEEKER_PROFILES, profileData);
    return response.data;
  }

  async updateSeekerProfile(id: string, profileData: Partial<SeekerProfile>): Promise<SeekerProfile> {
    const response = await this.client.patch<SeekerProfile>(`${API_ENDPOINTS.SEEKER_PROFILES}${id}/`, profileData);
    return response.data;
  }

  async updateUserInfo(userId: string, userData: { email?: string; phone?: string }): Promise<any> {
    const response = await this.client.patch(`/api/v2/users/${userId}/update/`, userData);
    return response.data;
  }

  async getCompanyProfiles(): Promise<CompanyProfile[]> {
    const response = await this.client.get<CompanyProfile[]>(API_ENDPOINTS.COMPANY_PROFILES);
    return response.data;
  }

  async createCompanyProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const response = await this.client.post<CompanyProfile>(API_ENDPOINTS.COMPANY_PROFILES, profileData);
    return response.data;
  }

  async updateCompanyProfile(id: string, profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const response = await this.client.patch<CompanyProfile>(`${API_ENDPOINTS.COMPANY_PROFILES}${id}/`, profileData);
    return response.data;
  }

  // ============================================================================
  // 履歴書関連API
  // ============================================================================

  async getResumes(): Promise<Resume[]> {
    const response = await this.client.get<any>(API_ENDPOINTS.RESUMES);
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async getResume(id: string): Promise<Resume> {
    const response = await this.client.get<Resume>(`${API_ENDPOINTS.RESUMES}${id}/`);
    return response.data;
  }

  // 公開履歴書（閲覧用）
  async getPublicUserResumes(userId: string): Promise<Resume[]> {
    const url = `${API_ENDPOINTS.PUBLIC_USER_BASE}${userId}/resumes/`;
    const res = await this.client.get<Resume[]>(url);
    return res.data as any;
  }

  async getPublicUserResumeDetail(userId: string, resumeId: string): Promise<Resume> {
    const url = `${API_ENDPOINTS.PUBLIC_USER_BASE}${userId}/resumes/${resumeId}/`;
    const res = await this.client.get<Resume>(url);
    return res.data as any;
  }

  async createResume(resumeData: CreateResumeRequest): Promise<Resume> {
    const response = await this.client.post<Resume>(API_ENDPOINTS.RESUMES, resumeData);
    return response.data;
  }

  async updateResume(id: string, resumeData: UpdateResumeRequest): Promise<Resume> {
    const response = await this.client.patch<Resume>(`${API_ENDPOINTS.RESUMES}${id}/`, resumeData);
    return response.data;
  }

  async deleteResume(id: string): Promise<void> {
    await this.client.delete(`${API_ENDPOINTS.RESUMES}${id}/`);
  }

  async checkResumeCompleteness(id: string): Promise<ResumeCompletenessCheck> {
    const response = await this.client.get<ResumeCompletenessCheck>(`${API_ENDPOINTS.RESUMES}${id}/completeness_check/`);
    return response.data;
  }

  // 職歴関連
  async addExperience(resumeId: string, experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.client.post<Experience>(`${API_ENDPOINTS.RESUMES}${resumeId}/add_experience/`, experienceData);
    return response.data;
  }

  async updateExperience(id: string, experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.client.patch<Experience>(`${API_ENDPOINTS.EXPERIENCES}${id}/`, experienceData);
    return response.data;
  }

  async deleteExperience(id: string): Promise<void> {
    await this.client.delete(`${API_ENDPOINTS.EXPERIENCES}${id}/`);
  }

  // 学歴関連
  async addEducation(resumeId: string, educationData: Partial<Education>): Promise<Education> {
    const response = await this.client.post<Education>(`${API_ENDPOINTS.RESUMES}${resumeId}/add_education/`, educationData);
    return response.data;
  }

  async updateEducation(id: string, educationData: Partial<Education>): Promise<Education> {
    const response = await this.client.patch<Education>(`${API_ENDPOINTS.EDUCATIONS}${id}/`, educationData);
    return response.data;
  }

  async deleteEducation(id: string): Promise<void> {
    await this.client.delete(`${API_ENDPOINTS.EDUCATIONS}${id}/`);
  }

  // 資格関連
  async addCertification(resumeId: string, certificationData: Partial<Certification>): Promise<Certification> {
    const response = await this.client.post<Certification>(`${API_ENDPOINTS.RESUMES}${resumeId}/add_certification/`, certificationData);
    return response.data;
  }

  async updateCertification(id: string, certificationData: Partial<Certification>): Promise<Certification> {
    const response = await this.client.patch<Certification>(`${API_ENDPOINTS.CERTIFICATIONS}${id}/`, certificationData);
    return response.data;
  }

  async deleteCertification(id: string): Promise<void> {
    await this.client.delete(`${API_ENDPOINTS.CERTIFICATIONS}${id}/`);
  }

  // ============================================================================
  // 企業 月次ページ
  // ============================================================================

  async getCompanyMonthlyCurrent(): Promise<CompanyMonthlyPage> {
    const res = await this.client.get<CompanyMonthlyPage>(API_ENDPOINTS.COMPANY_MONTHLY_CURRENT);
    return res.data;
  }

  async getCompanyMonthly(year: number, month: number): Promise<CompanyMonthlyPage> {
    const url = `${API_ENDPOINTS.COMPANY_MONTHLY_BASE}${year}/${month}/`;
    const res = await this.client.get<CompanyMonthlyPage>(url);
    return res.data;
  }

  async updateCompanyMonthly(year: number, month: number, payload: Partial<CompanyMonthlyPage>): Promise<CompanyMonthlyPage> {
    const url = `${API_ENDPOINTS.COMPANY_MONTHLY_BASE}${year}/${month}/`;
    const res = await this.client.put<CompanyMonthlyPage>(url, payload);
    return res.data;
  }

  // ============================================================================
  // 検索・マッチング関連API
  // ============================================================================

  async searchSeekers(searchParams: SearchSeekersRequest): Promise<SearchSeekersResponse> {
    const response = await this.client.get<SearchSeekersResponse>(API_ENDPOINTS.SEARCH_SEEKERS, {
      params: searchParams
    });
    return response.data;
  }

  // 応募関連
  async getApplications(): Promise<Application[]> {
    const response = await this.client.get<any>(API_ENDPOINTS.APPLICATIONS);
    const data = response.data as any;
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async createApplication(applicationData: CreateApplicationRequest): Promise<Application> {
    const response = await this.client.post<Application>(API_ENDPOINTS.APPLICATIONS, applicationData);
    return response.data;
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application> {
    const response = await this.client.patch<Application>(`${API_ENDPOINTS.APPLICATIONS}${id}/`, { status });
    return response.data;
  }

  // メッセージ関連
  async getSeekerMessages(): Promise<Message[]> {
    const response = await this.client.get<Message[]>(API_ENDPOINTS.MESSAGES_SEEKER);
    return response.data as any;
  }

  // 企業: 新規求人作成（簡易API）
  async createCompanyJob(payload: any): Promise<{ message: string; job_id?: string }>{
    const response = await this.client.post(API_ENDPOINTS.COMPANY_JOBS_NEW, payload);
    return response.data as any;
  }

  // スカウト関連
  async getScouts(): Promise<Scout[]> {
    const response = await this.client.get<any>(API_ENDPOINTS.SCOUTS);
    const data = response.data as any;
    // DRF Pagination対応：resultsに配列が入る
    return Array.isArray(data) ? data : (data?.results ?? []);
  }

  async createScout(scoutData: CreateScoutRequest): Promise<Scout> {
    const response = await this.client.post<Scout>(API_ENDPOINTS.SCOUTS, scoutData);
    return response.data;
  }

  async markScoutViewed(id: string): Promise<Scout> {
    const response = await this.client.post<Scout>(`${API_ENDPOINTS.SCOUTS}${id}/mark_viewed/`);
    return response.data;
  }

  async respondScout(id: string): Promise<Scout> {
    const response = await this.client.post<Scout>(`${API_ENDPOINTS.SCOUTS}${id}/respond/`);
    return response.data;
  }

  async delete(endpoint: string): Promise<void> {
    await this.client.delete(endpoint);
  }

  // ============================================================================
  // ダッシュボード・統計関連API
  // ============================================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>(API_ENDPOINTS.DASHBOARD_STATS);
    return response.data;
  }

  // ==========================================================================
  // アドバイス通知
  // ==========================================================================

  async getAdviceNotifications(): Promise<any> {
    const res = await this.client.get('/api/v2/advice/notifications/');
    return res.data as any;
  }

  async markAdviceRead(subject?: 'resume_advice' | 'advice' | 'interview'): Promise<any> {
    const res = await this.client.post('/api/v2/advice/mark_read/', subject ? { subject } : {});
    return res.data as any;
  }

  // ============================================================================
  // ユーティリティメソッド
  // ============================================================================

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health/');
      return response.data;
    } catch (error) {
      return { status: 'error' };
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ファイルアップロード（将来拡張用）
  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
}

// ============================================================================
// エラーハンドリングユーティリティ
// ============================================================================

export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response?.data) {
    return error.response.data as ApiError;
  }
  
  return {
    detail: error.message || 'An unexpected error occurred',
  };
};

export const isApiError = (error: any): error is ApiError => {
  return error && (error.detail || error.errors);
};

// ============================================================================
// React Query用のキー生成関数
// ============================================================================

export const queryKeys = {
  // プロフィール
  userProfile: () => ['user', 'profile'] as const,
  seekerProfiles: () => ['seeker', 'profiles'] as const,
  companyProfiles: () => ['company', 'profiles'] as const,
  
  // 履歴書
  resumes: () => ['resumes'] as const,
  resume: (id: string) => ['resumes', id] as const,
  resumeCompleteness: (id: string) => ['resumes', id, 'completeness'] as const,
  
  // マッチング
  applications: () => ['applications'] as const,
  scouts: () => ['scouts'] as const,
  searchSeekers: (params: SearchSeekersRequest) => ['search', 'seekers', params] as const,
  
  // ダッシュボード
  dashboardStats: () => ['dashboard', 'stats'] as const,
} as const;

// ============================================================================
// シングルトンインスタンス
// ============================================================================

export const apiV2Client = new ApiV2Client();
export default apiV2Client;
