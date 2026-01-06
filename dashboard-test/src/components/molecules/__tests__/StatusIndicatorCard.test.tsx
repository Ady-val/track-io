import { render, screen } from "@/test-utils/custom-render";

import { StatusIndicatorCard } from "../StatusIndicatorCard";

// Mock del hook useStatusDuration
jest.mock("@/hooks/useStatusDuration", () => ({
  useStatusDuration: jest.fn((onStartTime, isOn) => {
    if (isOn === true && onStartTime) {
      return {
        duration: "02:30:45",
        isActive: true,
      };
    }
    return {
      duration: "00:00:00",
      isActive: false,
    };
  }),
}));

// Mock de getMeasurementConfig - retornar un componente React válido
jest.mock("@/lib/measurementUtils", () => ({
  getMeasurementConfig: jest.fn(() => ({
    icon: ({ className }: { className?: string }) => (
      <svg data-testid="mock-icon" className={className}>
        <path d="M0 0" />
      </svg>
    ),
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.1)",
  })),
}));

// Mock de Card y CardBody para que rendericen correctamente en tests
jest.mock("@components/atoms", () => {
  const actual = jest.requireActual("@components/atoms");
  return {
    ...actual,
    Card: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="card" {...props}>
        {children}
      </div>
    ),
    CardBody: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="card-body" {...props}>
        {children}
      </div>
    ),
    Text: ({ children, className, ...props }: any) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
  };
});

describe("StatusIndicatorCard", () => {
  const defaultProps = {
    title: "Test Sensor",
    subtitle: "TEST-001",
    type: "status" as const,
    isOn: true,
  };

  it("should render with ON status", () => {
    render(<StatusIndicatorCard {...defaultProps} isOn={true} />);

    expect(screen.getByText("Test Sensor")).toBeInTheDocument();
    expect(screen.getByText("TEST-001")).toBeInTheDocument();
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("should render with OFF status", () => {
    render(<StatusIndicatorCard {...defaultProps} isOn={false} />);

    expect(screen.queryByText("ON")).not.toBeInTheDocument();
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("should render N/A when isOn is null", () => {
    render(<StatusIndicatorCard {...defaultProps} isOn={null} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("should render N/A when isOn is undefined", () => {
    render(<StatusIndicatorCard {...defaultProps} isOn={undefined} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("should display duration when status is ON and onStartTime is provided", () => {
    render(
      <StatusIndicatorCard
        {...defaultProps}
        isOn={true}
        onStartTime="2024-01-01T10:00:00Z"
      />
    );

    expect(screen.getByText("02:30:45")).toBeInTheDocument();
  });

  it("should not display duration when status is OFF", () => {
    render(
      <StatusIndicatorCard
        {...defaultProps}
        isOn={false}
        onStartTime="2024-01-01T10:00:00Z"
      />
    );

    // Should show placeholder but not the actual duration
    expect(screen.queryByText("02:30:45")).not.toBeInTheDocument();
  });

  it("should display timestamp when provided", () => {
    const timestamp = "2024-01-01T12:00:00Z";
    render(<StatusIndicatorCard {...defaultProps} timestamp={timestamp} />);

    expect(screen.getByText(/Actualizado:/)).toBeInTheDocument();
  });

  it("should display 'Esperando señal' when no timestamp is provided", () => {
    render(<StatusIndicatorCard {...defaultProps} timestamp={undefined} />);

    expect(screen.getByText("Esperando señal")).toBeInTheDocument();
  });

  it("should display 'Esperando señal' when isOn is null and no timestamp", () => {
    render(
      <StatusIndicatorCard
        {...defaultProps}
        isOn={null}
        timestamp={undefined}
      />
    );

    expect(screen.getByText("Esperando señal")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <StatusIndicatorCard {...defaultProps} className="custom-class" />
    );

    // Buscar el card que contiene la clase custom-class
    const card = container.querySelector('[class*="custom-class"]');
    expect(card).toBeTruthy();
  });

  it("should render icon", () => {
    render(<StatusIndicatorCard {...defaultProps} />);

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("should have correct color classes for ON status", () => {
    const { container } = render(
      <StatusIndicatorCard {...defaultProps} isOn={true} />
    );

    const statusCircle = container.querySelector(".bg-green-500");
    expect(statusCircle).toBeTruthy();

    const statusText = container.querySelector(".text-green-400");
    expect(statusText).toBeTruthy();
  });

  it("should have correct color classes for OFF status", () => {
    const { container } = render(
      <StatusIndicatorCard {...defaultProps} isOn={false} />
    );

    const statusCircle = container.querySelector(".bg-red-500");
    expect(statusCircle).toBeTruthy();

    const statusText = container.querySelector(".text-red-400");
    expect(statusText).toBeTruthy();
  });

  it("should have correct color classes for N/A status", () => {
    const { container } = render(
      <StatusIndicatorCard {...defaultProps} isOn={null} />
    );

    const statusCircle = container.querySelector(".bg-gray-500");
    expect(statusCircle).toBeTruthy();

    const statusText = container.querySelector(".text-slate-400");
    expect(statusText).toBeTruthy();
  });
});
