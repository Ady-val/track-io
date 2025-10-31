import type React from "react";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = "",
  ...props
}) => {
  const defaultClassName =
    "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";

  const combinedClassName = `${defaultClassName} ${className}`;

  return <input className={combinedClassName} {...props} />;
};

