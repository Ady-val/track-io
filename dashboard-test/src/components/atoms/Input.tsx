import type React from "react";
import { Input as HeroUIInput } from "@heroui/input";
import type { InputProps as HeroUIInputProps } from "@heroui/input";

export interface InputProps extends HeroUIInputProps {}

export const Input: React.FC<InputProps> = ({ classNames, ...props }) => {
  const defaultClassNames = {
    input: "text-slate-100",
    inputWrapper: "bg-slate-700 border-slate-600",
    ...classNames,
  };

  return <HeroUIInput classNames={defaultClassNames} {...props} />;
};
