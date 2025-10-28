import type React from "react";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "caption"
  | "small";
export type TextColor =
  | "primary"
  | "secondary"
  | "muted"
  | "success"
  | "warning"
  | "danger";

export interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = "body",
  color = "primary",
  className = "",
  as,
}) => {
  const variantClasses: Record<TextVariant, string> = {
    h1: "text-3xl md:text-4xl font-bold",
    h2: "text-2xl md:text-3xl font-bold",
    h3: "text-xl md:text-2xl font-semibold",
    h4: "text-lg md:text-xl font-semibold",
    body: "text-base",
    caption: "text-sm",
    small: "text-xs",
  };

  const colorClasses: Record<TextColor, string> = {
    primary: "text-blue-900",
    secondary: "text-blue-700",
    muted: "text-blue-500",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  const Component = as ?? (variant.startsWith("h") ? variant : "p");
  const classes = `${variantClasses[variant]} ${colorClasses[color]} ${className}`;

  return <Component className={classes}>{children}</Component>;
};
