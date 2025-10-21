import { useQuery } from "@tanstack/react-query";
import receptorService from "../lib/services/receptor.service";

export const useReceptors = () => {
  return useQuery({
    queryKey: ["receptors"],
    queryFn: () => receptorService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes - receptors don't change often
  });
};

export const useClockReceptors = () => {
  return useQuery({
    queryKey: ["receptors", "clock"],
    queryFn: () => receptorService.getClockReceptors(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useReceptorsByDepartment = (department: string) => {
  return useQuery({
    queryKey: ["receptors", "department", department],
    queryFn: () => receptorService.getByDepartment(department),
    enabled: !!department,
    staleTime: 10 * 60 * 1000,
  });
};

