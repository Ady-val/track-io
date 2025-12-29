import "@testing-library/jest-dom";
import React from "react";
import { cleanupQueryClient } from "@/test-utils/custom-render";

// El mock de framer-motion se movió a jest.setup-before.ts para que se cargue antes

// Mock de @heroui/system para resolver problemas con ESM
jest.mock("@heroui/system", () => {
  const React = require("react");
  return {
    HeroUIProvider: ({ children }: { children: React.ReactNode }) => children,
    forwardRef: React.forwardRef,
    useMemo: React.useMemo,
    useState: React.useState,
    useCallback: React.useCallback,
    useEffect: React.useEffect,
    useRef: React.useRef,
    useContext: React.useContext,
    createContext: React.createContext,
    useProviderContext: () => ({}),
    mapPropsVariants: (props: any, variantKeys: string[]) => {
      // Separar props en variantProps y restProps
      const variantProps: any = {};
      const restProps: any = {};

      Object.keys(props || {}).forEach((key) => {
        if (variantKeys.includes(key)) {
          variantProps[key] = props[key];
        } else {
          restProps[key] = props[key];
        }
      });

      return [variantProps, restProps];
    },
    useInputLabelPlacement: () => ({
      labelPlacement: "inside",
      isFilled: false,
      isFocusVisible: false,
    }),
    // Agregar otras funciones comunes que puedan ser necesarias
    tv: (_config: any) => (_props: any) => "",
    cn: (...args: any[]) => args.filter(Boolean).join(" "),
  };
});

// El mock de @heroui/ripple se movió a jest.setup-before.ts

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock de window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Cleanup después de cada test
// Nota: @testing-library/react v14+ hace cleanup automático, no es necesario llamarlo manualmente
afterEach(() => {
  jest.clearAllMocks();
  // Limpiar QueryClient después de cada test para evitar MESSAGEPORT abiertos
  cleanupQueryClient();
});
