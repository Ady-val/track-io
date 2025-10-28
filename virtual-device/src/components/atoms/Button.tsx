import type { ButtonProps as HeroUIButtonProps } from "@heroui/button";
import type React from "react";

import { Button as HeroUIButton } from "@heroui/button";

export interface ButtonProps extends HeroUIButtonProps {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <HeroUIButton {...props}>{children}</HeroUIButton>;
};
