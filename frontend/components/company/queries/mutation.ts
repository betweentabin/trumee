import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-v2-client';
import { toast } from 'react-hot-toast';

// Send message to user
export const useMessageToUser = (onSuccess?: (data: any) => void) => {
  return useMutation({
    mutationFn: (data: { receiver: string; subject?: string; content: string }) =>
      apiClient.sendMessage(data),
    onSuccess: (data) => {
      toast.success('Message sent successfully');
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast.error('Failed to send message');
      console.error('Message send error:', error);
    },
  });
};

// Scout seeker
export const useScoutSeeker = (onSuccess?: (data: any) => void) => {
  return useMutation({
    mutationFn: (data: { seeker: string; scout_message: string }) =>
      apiClient.createScout(data),
    onSuccess: (data) => {
      toast.success('Scout sent successfully');
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast.error('Failed to send scout');
      console.error('Scout send error:', error);
    },
  });
};

// Search seekers
export const useSearchSeekers = (onSuccess?: (data: any) => void) => {
  return useMutation({
    mutationFn: (params: { q?: string; skills?: string; location?: string }) =>
      apiClient.searchSeekers(params),
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast.error('Search failed');
      console.error('Search error:', error);
    },
  });
};

// Get seekers list
export const useGetSeekers = (params?: { q?: string; skills?: string; location?: string }) => {
  return useQuery({
    queryKey: ['seekers', params],
    queryFn: () => apiClient.searchSeekers(params || {}),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Update application status
export const useUpdateApplicationStatus = (onSuccess?: (data: any) => void) => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateApplicationStatus(id, status),
    onSuccess: (data) => {
      toast.success('Status updated successfully');
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    },
  });
};