import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-v2-client';

// React Query用のカスタムフック

// 認証関連
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      toast.success('ログインしました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'ログインに失敗しました');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      toast.success('登録が完了しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '登録に失敗しました');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear();
      toast.success('ログアウトしました');
    },
  });
};

// ユーザープロフィール
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => apiClient.getUserProfile(),
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.updateUserProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'profile'], data);
      toast.success('プロフィールを更新しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新に失敗しました');
    },
  });
};

// 履歴書関連
export const useResumes = () => {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: () => apiClient.getResumes(),
  });
};

export const useResume = (id: string) => {
  return useQuery({
    queryKey: ['resumes', id],
    queryFn: () => apiClient.getResume(id),
    enabled: !!id,
  });
};

export const useCreateResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('履歴書を作成しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '作成に失敗しました');
    },
  });
};

export const useUpdateResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateResume(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resumes', variables.id] });
      toast.success('履歴書を更新しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新に失敗しました');
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('履歴書を削除しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '削除に失敗しました');
    },
  });
};

export const useActivateResume = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.activateResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('履歴書を有効化しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '有効化に失敗しました');
    },
  });
};

// 職歴関連
export const useExperiences = () => {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: () => apiClient.getExperiences(),
  });
};

export const useCreateExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success('職歴を追加しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '追加に失敗しました');
    },
  });
};

export const useUpdateExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success('職歴を更新しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新に失敗しました');
    },
  });
};

export const useDeleteExperience = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success('職歴を削除しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '削除に失敗しました');
    },
  });
};

// 応募関連
export const useApplications = () => {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => apiClient.getApplications(),
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { company: string; resume?: string }) =>
      apiClient.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('応募しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '応募に失敗しました');
    },
  });
};

// スカウト関連
export const useScouts = () => {
  return useQuery({
    queryKey: ['scouts'],
    queryFn: () => apiClient.getScouts(),
  });
};

export const useCreateScout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { seeker: string; scout_message: string }) =>
      apiClient.createScout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouts'] });
      toast.success('スカウトを送信しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'スカウト送信に失敗しました');
    },
  });
};

export const useViewScout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.viewScout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouts'] });
    },
  });
};

export const useRespondScout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.respondScout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scouts'] });
      toast.success('スカウトに返信しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '返信に失敗しました');
    },
  });
};

// メッセージ関連
export const useMessages = () => {
  return useQuery({
    queryKey: ['messages'],
    queryFn: () => apiClient.getMessages(),
    refetchInterval: 30000, // 30秒ごとに更新
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { receiver: string; subject?: string; content: string }) =>
      apiClient.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('メッセージを送信しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '送信に失敗しました');
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.markMessageAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => apiClient.getUnreadCount(),
    refetchInterval: 60000, // 1分ごとに更新
  });
};

// 検索関連
export const useSearchSeekers = (params: { q?: string; skills?: string; location?: string }) => {
  return useQuery({
    queryKey: ['search', 'seekers', params],
    queryFn: () => apiClient.searchSeekers(params),
    enabled: !!(params.q || params.skills || params.location),
  });
};

// ダッシュボード
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiClient.getDashboardStats(),
    refetchInterval: 300000, // 5分ごとに更新
  });
};

// 支払い関連
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient.getPayments(),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('支払い方法を追加しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '追加に失敗しました');
    },
  });
};