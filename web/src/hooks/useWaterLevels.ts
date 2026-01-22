import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterLevelsApi } from '@/services/api';

export const useWaterLevels = (params?: { siteId?: string; boreholeId?: string; dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['waterLevels', params],
    queryFn: () => waterLevelsApi.getAll(params),
    enabled: !!(params?.siteId || params?.boreholeId),
  });
};

export const useWaterLevel = (id: string) => {
  return useQuery({
    queryKey: ['waterLevel', id],
    queryFn: () => waterLevelsApi.getById(id),
    enabled: !!id,
  });
};

export const useWaterLevelTrends = (siteId: string, params?: { dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['waterLevelTrends', siteId, params],
    queryFn: () => waterLevelsApi.getTrends(siteId, params),
    enabled: !!siteId,
  });
};

export const useCreateWaterLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waterLevelsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waterLevels'] });
      queryClient.invalidateQueries({ queryKey: ['waterLevelTrends'] });
      if (data?.data?.siteId) {
        queryClient.invalidateQueries({ queryKey: ['site', data.data.siteId] });
      }
    },
  });
};

export const useUpdateWaterLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => waterLevelsApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waterLevel', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['waterLevels'] });
      queryClient.invalidateQueries({ queryKey: ['waterLevelTrends'] });
    },
  });
};

export const useDeleteWaterLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waterLevelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLevels'] });
      queryClient.invalidateQueries({ queryKey: ['waterLevelTrends'] });
    },
  });
};
