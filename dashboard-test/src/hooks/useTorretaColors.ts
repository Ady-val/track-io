import { useQuery } from "@tanstack/react-query";

import torretaColorService from "../lib/services/torretaColor.service";

export const useTorretaColors = () => {
  return useQuery({
    queryKey: ["torretaColors"],
    queryFn: () => torretaColorService.getAll(),
    staleTime: 15 * 60 * 1000, // 15 minutes - torreta colors are static
  });
};
