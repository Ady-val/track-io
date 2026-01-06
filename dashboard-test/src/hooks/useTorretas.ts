import { useTorretas as useTorretasFromCatalogs } from "./useCatalogs";

export const useTorretas = () => {
  return useTorretasFromCatalogs({ active: true });
};
