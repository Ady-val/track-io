import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  const baseClasses =
    "px-3 py-2 bg-white border rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const errorClasses = error ? "border-red-300" : "border-gray-300";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`${baseClasses} ${errorClasses} w-full ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
