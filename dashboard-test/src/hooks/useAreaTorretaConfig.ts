import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import areaTorretaConfigService, {
  type CreateAreaTorretaConfigDto,
  type UpdateAreaTorretaConfigDto,
} from "@/lib/services/areaTorretaConfig.service";

export const useAreaTorretaConfigs = (areaId: number) => {
  return useQuery({
    queryKey: ["areaTorretaConfigs", areaId],
    queryFn: () => areaTorretaConfigService.getByArea(areaId),
    enabled: !!areaId,
  });
};

export const useCreateAreaTorretaConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAreaTorretaConfigDto) =>
      areaTorretaConfigService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["areaTorretaConfigs", variables.areaId],
      });
    },
  });
};

export const useUpdateAreaTorretaConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAreaTorretaConfigDto;
      areaId: number;
    }) => areaTorretaConfigService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["areaTorretaConfigs", variables.areaId],
      });
    },
  });
};

export const useDeleteAreaTorretaConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, areaId: _areaId }: { id: number; areaId: number }) =>
      areaTorretaConfigService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["areaTorretaConfigs", variables.areaId],
      });
    },
  });
};
