/**
 * API v2 型定義
 * 新しいデータベーススキーマに対応
 */

// ============================================================================
// 基本型
// ============================================================================

export type UUID = string;

export interface BaseModel {
  id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface ApiError {
  detail?: string;
  errors?: { [key: string]: string[] };
}

// ============================================================================
// ユーザー関連
// ============================================================================

export type UserRole = 'user' | 'company' | 'admin';
export type Gender = 'male' | 'female' | 'other';

export interface User extends BaseModel {
  email: string;
  username: string;
  role: UserRole;
  full_name: string;
  kana: string;
  gender?: Gender;
  is_staff?: boolean;
  is_superuser?: boolean;
  company_name?: string;
  capital?: number;
  company_url?: string;
  campaign_code?: string;
  employee_count?: number;
  founded_year?: number;
  industry?: string;
  company_description?: string;
  headquarters?: string;
  phone?: string;
  is_premium: boolean;
  premium_expiry?: string;
}

export interface SeekerProfile extends BaseModel {
  user: UUID;
  first_name: string;
  last_name: string;
  first_name_kana: string;
  last_name_kana: string;
  full_name: string;
  full_name_kana: string;
  birthday?: string;
  prefecture?: string;
  faculty?: string;
  graduation_year?: number;
  experience_years: number;
  current_salary?: string;
  desired_salary?: string;
  skill_vector?: number[];
  profile_embeddings?: { [key: string]: any };
}

export interface CompanyProfile extends BaseModel {
  user: UUID;
  company_name: string;
  capital?: number;
  company_url?: string;
  campaign_code?: string;
  employee_count?: number;
  founded_year?: number;
  industry?: string;
  company_description?: string;
  headquarters?: string;
  contact_person?: string;
  contact_department?: string;
}

// ============================================================================
// 履歴書関連
// ============================================================================

export type EmploymentType = 'fulltime' | 'contract' | 'parttime' | 'dispatch' | 'freelance' | 'internship' | 'other';
export type EducationType = 'high_school' | 'vocational' | 'junior_college' | 'university' | 'graduate' | 'other';

export interface Experience extends BaseModel {
  resume: UUID;
  company: string;
  period_from: string;
  period_to?: string;
  employment_type: EmploymentType;
  position?: string;
  business?: string;
  capital?: string;
  team_size?: string;
  tasks: string;
  industry?: string;
  achievements?: string;
  technologies_used?: string[];
  duration_months: number;
  is_current: boolean;
  order: number;
  skill_tags?: string[];
  experience_embeddings?: { [key: string]: any };
}

export interface Education extends BaseModel {
  resume: UUID;
  school_name: string;
  faculty?: string;
  major?: string;
  graduation_date?: string;
  education_type: EducationType;
  order: number;
}

export interface Certification extends BaseModel {
  resume: UUID;
  name: string;
  issuer?: string;
  obtained_date?: string;
  expiry_date?: string;
  is_expired: boolean;
  order: number;
}

export interface Resume extends BaseModel {
  user: UUID;
  user_email: string;
  title: string;
  description?: string;
  objective?: string;
  submitted_at: string;
  is_active: boolean;
  desired_job?: string;
  desired_industries?: string[];
  desired_locations?: string[];
  skills?: string;
  self_pr?: string;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  match_score: number;
  is_complete: boolean;
  extra_data?: { [key: string]: any };
  resume_vector?: number[];
}

// 公開プロフィール（閲覧用）
export interface PublicUserProfile {
  id: UUID;
  full_name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  profile_extension?: {
    bio?: string;
    headline?: string;
    profile_image_url?: string;
    location?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    available_for_work?: boolean;
  };
  privacy_settings?: {
    is_profile_public: boolean;
    show_email: boolean;
    show_phone: boolean;
    show_resumes: boolean;
  };
  resumes?: Array<{
    id: UUID;
    title: string;
    description?: string;
    is_active: boolean;
    created_at?: string;
  }>;
  seeker_profile?: {
    experience_years?: number;
    prefecture?: string;
    current_salary?: string;
    desired_salary?: string;
  };
}

// ============================================================================
// マッチング関連
// ============================================================================

export type ApplicationStatus = 'pending' | 'viewed' | 'accepted' | 'interview' | 'offered' | 'rejected' | 'hired' | 'withdrawn';
export type ScoutStatus = 'sent' | 'viewed' | 'responded' | 'expired';

export interface Application extends BaseModel {
  applicant: UUID;
  applicant_name: string;
  company: UUID;
  company_name: string;
  resume?: UUID;
  status: ApplicationStatus;
  applied_at: string;
  viewed_at?: string;
  responded_at?: string;
  match_score: number;
  recommendation_rank?: number;
  notes?: string;
  rejection_reason?: string;
}

export interface Scout extends BaseModel {
  company: UUID;
  company_name: string;
  seeker: UUID;
  seeker_name: string;
  status: ScoutStatus;
  scout_message: string;
  scouted_at: string;
  viewed_at?: string;
  responded_at?: string;
  expires_at?: string;
  match_score: number;
  success_probability: number;
}

export interface Message extends BaseModel {
  sender: UUID;
  sender_name: string;
  receiver: UUID;
  receiver_name: string;
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  application?: UUID;
  scout?: UUID;
}

// ============================================================================
// 企業 月次ページ
// ============================================================================

export interface CompanyMonthlyPage extends BaseModel {
  company: UUID;
  year: number;
  month: number;
  title: string;
  content: { [key: string]: any };
  is_published: boolean;
  page_url: string;
}

// ============================================================================
// リクエスト・レスポンス型
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  username: string;
  role: 'user';
  full_name: string;
  kana: string;
  phone?: string;
  gender?: Gender;
  first_name?: string;
  last_name?: string;
  first_name_kana?: string;
  last_name_kana?: string;
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  company_name: string;
  capital?: number;
  company_url?: string;
  phone?: string;
  campaign_code?: string;
}

export interface SearchSeekersRequest {
  keyword?: string;
  prefecture?: string;
  industry?: string;
  experience_years_min?: number;
  experience_years_max?: number;
  page?: number;
  page_size?: number;
}

export interface SearchSeekersResponse extends ApiResponse<SeekerProfile> {}

export interface CreateResumeRequest {
  title: string;
  description?: string;
  objective?: string;
  desired_job?: string;
  desired_industries?: string[];
  desired_locations?: string[];
  skills?: string;
  self_pr?: string;
  experiences?: Omit<Experience, 'id' | 'resume' | 'duration_months' | 'is_current' | 'created_at' | 'updated_at'>[];
  educations?: Omit<Education, 'id' | 'resume' | 'created_at' | 'updated_at'>[];
  certifications?: Omit<Certification, 'id' | 'resume' | 'is_expired' | 'created_at' | 'updated_at'>[];
}

export interface UpdateResumeRequest extends Partial<CreateResumeRequest> {
  is_active?: boolean;
}

export interface CreateApplicationRequest {
  company: UUID;
  resume?: UUID;
  job_posting_id?: UUID;
}

export interface CreateScoutRequest {
  seeker: UUID;
  scout_message: string;
}

// ============================================================================
// ダッシュボード・統計
// ============================================================================

export interface SeekerDashboardStats {
  resumes_count: number;
  active_resumes_count: number;
  applications_count: number;
  scouts_received_count: number;
  recent_activities: any[];
}

export interface CompanyDashboardStats {
  applications_received_count: number;
  scouts_sent_count: number;
  pending_applications_count: number;
  active_scouts_count: number;
  recent_activities: any[];
}

export type DashboardStats = SeekerDashboardStats | CompanyDashboardStats;

export interface ResumeCompletenessCheck {
  is_complete: boolean;
  has_skills: boolean;
  has_self_pr: boolean;
  has_experiences: boolean;
  has_educations: boolean;
  has_certifications: boolean;
  experience_count: number;
  education_count: number;
  certification_count: number;
}

// ============================================================================
// フォーム用型定義
// ============================================================================

export interface ProfileFormData {
  email?: string;
  firstName?: string;
  lastName?: string;
  firstNameKana?: string;
  lastNameKana?: string;
  birthday?: string;
  gender?: Gender;
  phone?: string;
  prefecture?: string;
}

export interface EducationFormData {
  school_name: string;
  faculty?: string;
  major?: string;
  graduation_date?: string;
  education_type: EducationType;
}

export interface ExperienceFormData {
  company: string;
  period_from: string;
  period_to?: string;
  employment_type: EmploymentType;
  position?: string;
  business?: string;
  capital?: string;
  team_size?: string;
  tasks: string;
  industry?: string;
  achievements?: string;
  technologies_used?: string[];
}

export interface CertificationFormData {
  name: string;
  issuer?: string;
  obtained_date?: string;
  expiry_date?: string;
}

export interface PreferenceFormData {
  desired_salary?: string;
  desired_industries?: string[];
  desired_job_types?: string[];
  desired_locations?: string[];
  work_style?: string;
  available_date?: string;
}

export interface StepFormData {
  profile: ProfileFormData;
  education: EducationFormData;
  experiences: ExperienceFormData[];
  preference: PreferenceFormData;
  skills?: string;
  self_pr?: string;
  certifications?: CertificationFormData[];
}

// ============================================================================
// ユーティリティ型
// ============================================================================

export type CreateRequestType<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRequestType<T> = Partial<CreateRequestType<T>>;

// API エンドポイントパス
export const API_ENDPOINTS = {
  // 認証
  LOGIN: '/api/v2/auth/login/',
  REGISTER_USER: '/api/v2/auth/register-user/',
  REGISTER_COMPANY: '/api/v2/auth/register-company/',
  
  // プロフィール
  USER_PROFILE: '/api/v2/profile/me/',
  SEEKER_PROFILES: '/api/v2/seeker-profiles/',
  COMPANY_PROFILES: '/api/v2/company-profiles/',
  
  // 履歴書
  RESUMES: '/api/v2/resumes/',
  EXPERIENCES: '/api/v2/experiences/',
  EDUCATIONS: '/api/v2/educations/',
  CERTIFICATIONS: '/api/v2/certifications/',
  
  // マッチング
  APPLICATIONS: '/api/v2/applications/',
  SCOUTS: '/api/v2/scouts/',
  SEARCH_SEEKERS: '/api/v2/search/seekers/',
  MESSAGES_SEEKER: '/api/v2/seeker/messages/',
  COMPANY_JOBS_NEW: '/api/v2/company/jobs/new/',
  
  // ダッシュボード
  DASHBOARD_STATS: '/api/v2/dashboard/stats/',
  
  // 企業 月次ページ
  COMPANY_MONTHLY_BASE: '/api/v2/company/monthly/',
  COMPANY_MONTHLY_CURRENT: '/api/v2/company/monthly/current/',
  
  // 公開ユーザー情報
  PUBLIC_USER_BASE: '/api/v2/users/',
} as const;
