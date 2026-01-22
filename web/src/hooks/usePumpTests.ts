import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pumpTestsApi } from '@/services/api';

export const usePumpTests = (params?: { siteId?: string; boreholeId?: string; testType?: string }) => {
  return useQuery({
    queryKey: ['pumpTests', params],
    queryFn: () => pumpTestsApi.getAll(params),
    enabled: !!(params?.siteId || params?.boreholeId),
  });
};

export const usePumpTest = (id: string) => {
  return useQuery({
    queryKey: ['pumpTest', id],
    queryFn: () => pumpTestsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePumpTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pumpTestsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pumpTests'] });
      if (data?.data?.siteId) {
        queryClient.invalidateQueries({ queryKey: ['site', data.data.siteId] });
      }
    },
  });
};

export const useUpdatePumpTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pumpTestsApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pumpTest', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pumpTests'] });
    },
  });
};

export const useDeletePumpTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pumpTestsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pumpTests'] });
    },
  });
};

export const useAddPumpTestEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pumpTestId, data }: { pumpTestId: string; data: any }) =>
      pumpTestsApi.addEntry(pumpTestId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pumpTest', variables.pumpTestId] });
    },
  });
};

export const useUpdatePumpTestEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pumpTestId, entryId, data }: { pumpTestId: string; entryId: string; data: any }) =>
      pumpTestsApi.updateEntry(pumpTestId, entryId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pumpTest', variables.pumpTestId] });
    },
  });
};

export const useDeletePumpTestEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pumpTestId, entryId }: { pumpTestId: string; entryId: string }) =>
      pumpTestsApi.deleteEntry(pumpTestId, entryId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pumpTest', variables.pumpTestId] });
    },
  });
};
