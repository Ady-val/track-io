import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Device {
  id: number;
  name: string;
  areaId: number;
  areaName: string;
  externalId: string;
  isVirtualDevice: boolean;
  deviceSignals?: DeviceSignal[];
}

export interface DeviceSignal {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  externalValueId: string;
}

export type EventStatus = "open" | "in-progress" | "closed";
