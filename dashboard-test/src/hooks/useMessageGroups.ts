import { useQuery } from "@tanstack/react-query";

import messageGroupService from "../lib/services/messageGroup.service";

export const useMessageGroups = () => {
  return useQuery({
    queryKey: ["messageGroups"],
    queryFn: () => messageGroupService.getAll(),
    staleTime: 15 * 60 * 1000, // 15 minutes - message groups are static
  });
};
