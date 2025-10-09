import type { CardProps as HeroUICardProps } from "@heroui/card";

import type React from "react";

import { Card as HeroUICard, CardBody as HeroUICardBody } from "@heroui/card";

export interface CardProps extends HeroUICardProps {
  children: React.ReactNode;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  const defaultClassName = `bg-slate-800 border-slate-700 ${className}`;

  return (
    <HeroUICard className={defaultClassName} {...props}>
      {children}
    </HeroUICard>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = "",
}) => {
  return <HeroUICardBody className={className}>{children}</HeroUICardBody>;
};
