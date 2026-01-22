import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterQualityApi } from '@/services/api';

export const useWaterQuality = (params?: { siteId?: string; boreholeId?: string; dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['waterQuality', params],
    queryFn: () => waterQualityApi.getAll(params),
    enabled: !!(params?.siteId || params?.boreholeId),
  });
};

export const useWaterQualityReading = (id: string) => {
  return useQuery({
    queryKey: ['waterQualityReading', id],
    queryFn: () => waterQualityApi.getById(id),
    enabled: !!id,
  });
};

export const useWaterQualitySummary = (siteId: string) => {
  return useQuery({
    queryKey: ['waterQualitySummary', siteId],
    queryFn: () => waterQualityApi.getSummary(siteId),
    enabled: !!siteId,
  });
};

export const useCreateWaterQuality = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waterQualityApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waterQuality'] });
      queryClient.invalidateQueries({ queryKey: ['waterQualitySummary'] });
      if (data?.data?.siteId) {
        queryClient.invalidateQueries({ queryKey: ['site', data.data.siteId] });
      }
    },
  });
};

export const useUpdateWaterQuality = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => waterQualityApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waterQualityReading', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['waterQuality'] });
      queryClient.invalidateQueries({ queryKey: ['waterQualitySummary'] });
    },
  });
};

export const useDeleteWaterQuality = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waterQualityApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterQuality'] });
      queryClient.invalidateQueries({ queryKey: ['waterQualitySummary'] });
    },
  });
};
