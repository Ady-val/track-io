import type React from "react";
import { Chip as HeroUIChip } from "@heroui/chip";
import type { ChipProps as HeroUIChipProps } from "@heroui/chip";

export interface ChipProps extends HeroUIChipProps {
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ children, ...props }) => {
  return <HeroUIChip {...props}>{children}</HeroUIChip>;
};
