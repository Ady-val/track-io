import type { InputProps as HeroUIInputProps } from "@heroui/input";

import type React from "react";

import { Input as HeroUIInput } from "@heroui/input";

export interface InputProps extends HeroUIInputProps {}

export const Input: React.FC<InputProps> = ({ classNames, ...props }) => {
  const defaultClassNames = {
    input: "text-white placeholder:text-slate-400",
    inputWrapper:
      "bg-slate-700 border-slate-600 hover:border-slate-500 focus-within:border-blue-500",
    ...classNames,
  };

  return <HeroUIInput classNames={defaultClassNames} {...props} />;
};
