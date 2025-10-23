import type { SpinnerProps as HeroUISpinnerProps } from "@heroui/spinner";

import type React from "react";

import { Spinner as HeroUISpinner } from "@heroui/spinner";

export interface SpinnerProps extends HeroUISpinnerProps {}

export const Spinner: React.FC<SpinnerProps> = (props) => {
  return <HeroUISpinner {...props} />;
};
