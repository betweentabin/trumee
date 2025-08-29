/**
 * API v2 用のReact Queryカスタムフック
 * 新しいAPIエンドポイントとの連携を簡素化
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  User, SeekerProfile, CompanyProfile, Resume, Experience, Education, Certification,
  Application, Scout, DashboardStats, ResumeCompletenessCheck,
  LoginRequest, LoginResponse, RegisterUserRequest, RegisterCompanyRequest,
  SearchSeekersRequest, SearchSeekersResponse, CreateResumeRequest, UpdateResumeRequest,
  CreateApplicationRequest, CreateScoutRequest, ApiError
} from '@/types/api-v2';
import apiV2Client, { handleApiError, queryKeys } from '@/lib/api-v2-client';

// ============================================================================
// 認証関連フック
// ============================================================================

export const useLogin = (options?: UseMutationOptions<LoginResponse, Error, LoginRequest>) => {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiV2Client.login(credentials),
    onSuccess: (data) => {
      toast.success('ログインしました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || 'ログインに失敗しました');
    },
    ...options,
  });
};

export const useRegisterUser = (options?: UseMutationOptions<LoginResponse, Error, RegisterUserRequest>) => {
  return useMutation({
    mutationFn: (userData: RegisterUserRequest) => apiV2Client.registerUser(userData),
    onSuccess: () => {
      toast.success('ユーザー登録が完了しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || 'ユーザー登録に失敗しました');
    },
    ...options,
  });
};

export const useRegisterCompany = (options?: UseMutationOptions<LoginResponse, Error, RegisterCompanyRequest>) => {
  return useMutation({
    mutationFn: (companyData: RegisterCompanyRequest) => apiV2Client.registerCompany(companyData),
    onSuccess: () => {
      toast.success('企業登録が完了しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '企業登録に失敗しました');
    },
    ...options,
  });
};

// ============================================================================
// プロフィール関連フック
// ============================================================================

export const useUserProfile = (options?: UseQueryOptions<User, Error>) => {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: () => apiV2Client.getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5分
    ...options,
  });
};

export const useSeekerProfiles = (options?: UseQueryOptions<SeekerProfile[], Error>) => {
  return useQuery({
    queryKey: queryKeys.seekerProfiles(),
    queryFn: () => apiV2Client.getSeekerProfiles(),
    staleTime: 10 * 60 * 1000, // 10分
    ...options,
  });
};

export const useUpdateSeekerProfile = (options?: UseMutationOptions<SeekerProfile, Error, { id: string; data: Partial<SeekerProfile> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiV2Client.updateSeekerProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seekerProfiles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
      toast.success('プロフィールを更新しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || 'プロフィール更新に失敗しました');
    },
    ...options,
  });
};

export const useCompanyProfiles = (options?: UseQueryOptions<CompanyProfile[], Error>) => {
  return useQuery({
    queryKey: queryKeys.companyProfiles(),
    queryFn: () => apiV2Client.getCompanyProfiles(),
    staleTime: 10 * 60 * 1000, // 10分
    ...options,
  });
};

export const useUpdateCompanyProfile = (options?: UseMutationOptions<CompanyProfile, Error, { id: string; data: Partial<CompanyProfile> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiV2Client.updateCompanyProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyProfiles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
      toast.success('企業プロフィールを更新しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '企業プロフィール更新に失敗しました');
    },
    ...options,
  });
};

// ============================================================================
// 履歴書関連フック
// ============================================================================

export const useResumes = (options?: UseQueryOptions<Resume[], Error>) => {
  return useQuery({
    queryKey: queryKeys.resumes(),
    queryFn: () => apiV2Client.getResumes(),
    staleTime: 5 * 60 * 1000, // 5分
    ...options,
  });
};

export const useResume = (id: string, options?: UseQueryOptions<Resume, Error>) => {
  return useQuery({
    queryKey: queryKeys.resume(id),
    queryFn: () => apiV2Client.getResume(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5分
    ...options,
  });
};

export const useCreateResume = (options?: UseMutationOptions<Resume, Error, CreateResumeRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resumeData: CreateResumeRequest) => apiV2Client.createResume(resumeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes() });
      toast.success('履歴書を作成しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '履歴書作成に失敗しました');
    },
    ...options,
  });
};

export const useUpdateResume = (options?: UseMutationOptions<Resume, Error, { id: string; data: UpdateResumeRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiV2Client.updateResume(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(id) });
      toast.success('履歴書を更新しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '履歴書更新に失敗しました');
    },
    ...options,
  });
};

export const useDeleteResume = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiV2Client.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes() });
      toast.success('履歴書を削除しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '履歴書削除に失敗しました');
    },
    ...options,
  });
};

export const useResumeCompleteness = (id: string, options?: UseQueryOptions<ResumeCompletenessCheck, Error>) => {
  return useQuery({
    queryKey: queryKeys.resumeCompleteness(id),
    queryFn: () => apiV2Client.checkResumeCompleteness(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2分
    ...options,
  });
};

// ============================================================================
// 職歴・学歴・資格関連フック
// ============================================================================

export const useAddExperience = (options?: UseMutationOptions<Experience, Error, { resumeId: string; data: Partial<Experience> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resumeId, data }) => apiV2Client.addExperience(resumeId, data),
    onSuccess: (_, { resumeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(resumeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeCompleteness(resumeId) });
      toast.success('職歴を追加しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '職歴追加に失敗しました');
    },
    ...options,
  });
};

export const useUpdateExperience = (options?: UseMutationOptions<Experience, Error, { id: string; data: Partial<Experience> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiV2Client.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes() });
      toast.success('職歴を更新しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '職歴更新に失敗しました');
    },
    ...options,
  });
};

export const useAddEducation = (options?: UseMutationOptions<Education, Error, { resumeId: string; data: Partial<Education> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resumeId, data }) => apiV2Client.addEducation(resumeId, data),
    onSuccess: (_, { resumeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(resumeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeCompleteness(resumeId) });
      toast.success('学歴を追加しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '学歴追加に失敗しました');
    },
    ...options,
  });
};

export const useAddCertification = (options?: UseMutationOptions<Certification, Error, { resumeId: string; data: Partial<Certification> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resumeId, data }) => apiV2Client.addCertification(resumeId, data),
    onSuccess: (_, { resumeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(resumeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeCompleteness(resumeId) });
      toast.success('資格を追加しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '資格追加に失敗しました');
    },
    ...options,
  });
};

// ============================================================================
// 検索・マッチング関連フック
// ============================================================================

export const useSearchSeekers = (searchParams: SearchSeekersRequest, options?: UseQueryOptions<SearchSeekersResponse, Error>) => {
  return useQuery({
    queryKey: queryKeys.searchSeekers(searchParams),
    queryFn: () => apiV2Client.searchSeekers(searchParams),
    staleTime: 2 * 60 * 1000, // 2分
    ...options,
  });
};

export const useApplications = (options?: UseQueryOptions<Application[], Error>) => {
  return useQuery({
    queryKey: queryKeys.applications(),
    queryFn: () => apiV2Client.getApplications(),
    staleTime: 5 * 60 * 1000, // 5分
    ...options,
  });
};

export const useCreateApplication = (options?: UseMutationOptions<Application, Error, CreateApplicationRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (applicationData: CreateApplicationRequest) => apiV2Client.createApplication(applicationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications() });
      toast.success('応募しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '応募に失敗しました');
    },
    ...options,
  });
};

export const useScouts = (options?: UseQueryOptions<Scout[], Error>) => {
  return useQuery({
    queryKey: queryKeys.scouts(),
    queryFn: () => apiV2Client.getScouts(),
    staleTime: 5 * 60 * 1000, // 5分
    ...options,
  });
};

export const useCreateScout = (options?: UseMutationOptions<Scout, Error, CreateScoutRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scoutData: CreateScoutRequest) => apiV2Client.createScout(scoutData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scouts() });
      toast.success('スカウトを送信しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || 'スカウト送信に失敗しました');
    },
    ...options,
  });
};

export const useMarkScoutViewed = (options?: UseMutationOptions<Scout, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiV2Client.markScoutViewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scouts() });
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      console.error('スカウト閲覧マークに失敗:', apiError.detail);
    },
    ...options,
  });
};

// ============================================================================
// ダッシュボード関連フック
// ============================================================================

export const useDashboardStats = (options?: UseQueryOptions<DashboardStats, Error>) => {
  return useQuery({
    queryKey: queryKeys.dashboardStats(),
    queryFn: () => apiV2Client.getDashboardStats(),
    staleTime: 10 * 60 * 1000, // 10分
    ...options,
  });
};

// ============================================================================
// ユーティリティフック
// ============================================================================

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiV2Client.logout(),
    onSuccess: () => {
      queryClient.clear(); // 全てのキャッシュをクリア
      toast.success('ログアウトしました');
    },
  });
};

export const useIsAuthenticated = () => {
  return apiV2Client.isAuthenticated();
};

// ============================================================================
// 複合フック（複数のAPIを組み合わせた処理）
// ============================================================================

export const useCompleteResumeSetup = () => {
  const createResume = useCreateResume();
  const addExperience = useAddExperience();
  const addEducation = useAddEducation();
  const addCertification = useAddCertification();
  
  return useMutation({
    mutationFn: async (data: {
      resume: CreateResumeRequest;
      experiences?: Partial<Experience>[];
      educations?: Partial<Education>[];
      certifications?: Partial<Certification>[];
    }) => {
      // 履歴書作成
      const resume = await apiV2Client.createResume(data.resume);
      
      // 職歴追加
      if (data.experiences?.length) {
        for (const exp of data.experiences) {
          await apiV2Client.addExperience(resume.id, exp);
        }
      }
      
      // 学歴追加
      if (data.educations?.length) {
        for (const edu of data.educations) {
          await apiV2Client.addEducation(resume.id, edu);
        }
      }
      
      // 資格追加
      if (data.certifications?.length) {
        for (const cert of data.certifications) {
          await apiV2Client.addCertification(resume.id, cert);
        }
      }
      
      return resume;
    },
    onSuccess: () => {
      toast.success('履歴書のセットアップが完了しました');
    },
    onError: (error) => {
      const apiError = handleApiError(error as any);
      toast.error(apiError.detail || '履歴書セットアップに失敗しました');
    },
  });
};
