import type { InputProps as HeroUIInputProps } from "@heroui/input";

import type React from "react";

import { Input as HeroUIInput } from "@heroui/input";

export interface InputProps extends HeroUIInputProps {}

export const Input: React.FC<InputProps> = ({ classNames, ...props }) => {
  const defaultClassNames = {
    input:
      "!text-white placeholder:text-slate-400",
    inputWrapper:
      props.labelPlacement === "outside"
        ? "bg-slate-700 border-slate-600 hover:border-slate-500 focus-within:border-blue-500 mt-1"
        : "bg-slate-700 border-slate-600 hover:border-slate-500 focus-within:border-blue-500",
    label: "!text-white text-sm",
    ...classNames,
  };

  // Merge classNames properly to ensure label color and spacing are applied
  const mergedClassNames = {
    ...defaultClassNames,
    ...classNames,
    inputWrapper: classNames?.inputWrapper
      ? `${defaultClassNames.inputWrapper} ${classNames.inputWrapper}`
      : defaultClassNames.inputWrapper,
    label: classNames?.label
      ? `${defaultClassNames.label} ${classNames.label}`
      : defaultClassNames.label,
  };

  return <HeroUIInput classNames={mergedClassNames} {...props} />;
};

