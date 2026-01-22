import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boreholesApi } from '@/services/api';

export const useBoreholes = (params?: { siteId?: string; qaStatus?: string; search?: string }) => {
  return useQuery({
    queryKey: ['boreholes', params],
    queryFn: () => boreholesApi.getAll(params),
    enabled: !!params?.siteId,
  });
};

export const useBorehole = (id: string) => {
  return useQuery({
    queryKey: ['borehole', id],
    queryFn: () => boreholesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateBorehole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boreholesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boreholes'] });
      if (data?.data?.siteId) {
        queryClient.invalidateQueries({ queryKey: ['site', data.data.siteId] });
      }
    },
  });
};

export const useUpdateBorehole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => boreholesApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['borehole', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['boreholes'] });
      if (result?.data?.siteId) {
        queryClient.invalidateQueries({ queryKey: ['site', result.data.siteId] });
      }
    },
  });
};

export const useDeleteBorehole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boreholesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boreholes'] });
    },
  });
};

export const useReviewBorehole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      boreholesApi.review(id, status, comment),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['borehole', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['boreholes'] });
    },
  });
};
