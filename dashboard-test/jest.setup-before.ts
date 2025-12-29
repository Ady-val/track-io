// Polyfills para TextEncoder y TextDecoder (necesarios para MSW)
// Estos están disponibles en Node.js 18+, pero los agregamos para compatibilidad
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  TextEncoder: NodeTextEncoder,
  TextDecoder: NodeTextDecoder,
} = require("util");

// Polyfill para MessagePort (necesario para undici)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  MessageChannel: NodeMessageChannel,
  MessagePort: NodeMessagePort,
} = require("worker_threads");

if (typeof global.MessagePort === "undefined") {
  global.MessagePort = NodeMessagePort;
}

if (typeof global.MessageChannel === "undefined") {
  global.MessageChannel = NodeMessageChannel;
}

if (typeof globalThis !== "undefined") {
  if (typeof globalThis.MessagePort === "undefined") {
    globalThis.MessagePort = NodeMessagePort;
  }
  if (typeof globalThis.MessageChannel === "undefined") {
    globalThis.MessageChannel = NodeMessageChannel;
  }
}

// Polyfill para BroadcastChannel (necesario para MSW)
class MockBroadcastChannel {
  name: string;
  private listeners: Array<(event: any) => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  postMessage(_message: any) {
    // Mock implementation - no hace nada en tests
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (type === "message") {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (type === "message") {
      this.listeners = this.listeners.filter((l) => l !== listener);
    }
  }

  close() {
    this.listeners = [];
  }
}

if (typeof global.BroadcastChannel === "undefined") {
  global.BroadcastChannel = MockBroadcastChannel as any;
}

if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.BroadcastChannel === "undefined"
) {
  globalThis.BroadcastChannel = MockBroadcastChannel as any;
}

// Para jsdom, también asignar a window si está disponible
if (
  typeof window !== "undefined" &&
  typeof (window as any).BroadcastChannel === "undefined"
) {
  (window as any).BroadcastChannel = MockBroadcastChannel;
}

// Asegurar que TextEncoder y TextDecoder estén disponibles en todos los contextos
// antes de que MSW se importe
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = NodeTextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = NodeTextDecoder;
}

// También asignar a globalThis
if (typeof globalThis !== "undefined") {
  if (typeof globalThis.TextEncoder === "undefined") {
    globalThis.TextEncoder = NodeTextEncoder;
  }
  if (typeof globalThis.TextDecoder === "undefined") {
    globalThis.TextDecoder = NodeTextDecoder;
  }
}

// Para jsdom, también asignar a window si está disponible
if (typeof window !== "undefined") {
  if (typeof (window as any).TextEncoder === "undefined") {
    (window as any).TextEncoder = NodeTextEncoder;
  }
  if (typeof (window as any).TextDecoder === "undefined") {
    (window as any).TextDecoder = NodeTextDecoder;
  }
}

// Polyfills para Web Streams API (necesarios para undici y MSW)
// Node.js 18+ tiene estas APIs, pero Jest/jsdom puede no tenerlas
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  ReadableStream: NodeReadableStream,
  WritableStream: NodeWritableStream,
  TransformStream: NodeTransformStream,
} = require("stream/web");

if (typeof global.ReadableStream === "undefined") {
  global.ReadableStream = NodeReadableStream;
  globalThis.ReadableStream = NodeReadableStream;
}

if (typeof global.WritableStream === "undefined") {
  global.WritableStream = NodeWritableStream;
  globalThis.WritableStream = NodeWritableStream;
}

if (typeof global.TransformStream === "undefined") {
  global.TransformStream = NodeTransformStream;
  globalThis.TransformStream = NodeTransformStream;
}

// Polyfills para Fetch API (necesarios para MSW)
// Node.js 18+ tiene fetch nativo, pero Jest/jsdom puede no tenerlo
// Estos deben estar disponibles ANTES de importar MSW
const undici = require("undici");

// Asignar directamente a global para asegurar que estén disponibles
global.fetch = undici.fetch;
global.Request = undici.Request;
global.Response = undici.Response;
global.Headers = undici.Headers;

// También asignar a globalThis por si acaso
if (typeof globalThis !== "undefined") {
  globalThis.fetch = undici.fetch;
  globalThis.Request = undici.Request;
  globalThis.Response = undici.Response;
  globalThis.Headers = undici.Headers;
}

// Mock de import.meta.env para Vite - debe ejecutarse ANTES de importar módulos
// @ts-expect-error - import.meta no está disponible en Node.js
globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: "http://localhost:3000",
      MODE: "test",
      DEV: false,
      PROD: false,
      SSR: false,
    },
  },
} as any;

// Mock de framer-motion ANTES de que se importen los módulos
// Esto es crítico para que @heroui/ripple lo use correctamente
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactLib = require("react");

const createMotionComponent = (elementName: string) => {
  const Component = ReactLib.forwardRef((props: any, ref: any) => {
    return ReactLib.createElement(elementName, { ...props, ref });
  });
  Component.displayName = `motion.${elementName}`;
  return Component;
};

const motionProxy = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      return createMotionComponent(prop);
    },
  }
);

jest.mock("framer-motion", () => ({
  motion: motionProxy,
  AnimatePresence: ({ children }: { children: any }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
  }),
  useMotionValue: () => ({ get: () => 0, set: jest.fn() }),
  useTransform: () => 0,
  motionValue: () => ({ get: () => 0, set: jest.fn() }),
}));

// Mock de @heroui/ripple - Jest usará el manual mock de __mocks__/@heroui/ripple.js
jest.mock("@heroui/ripple");
