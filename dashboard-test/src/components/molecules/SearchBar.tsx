import type React from "react";

import { FaMagnifyingGlass } from "react-icons/fa6";

import { Input } from "@components/atoms";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  size = "sm",
}) => {
  return (
    <Input
      placeholder={placeholder}
      size={size}
      startContent={<FaMagnifyingGlass className="text-slate-400" />}
      value={value}
      variant="bordered"
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
