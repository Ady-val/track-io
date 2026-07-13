import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test-utils/custom-render";

import { StatusIndicatorCard } from "../StatusIndicatorCard";

// Mock del hook useDurationTicker (la tarjeta calcula la duración con
// statusDurationSeconds del backend, no con onStartTime).
jest.mock("@/hooks/useDurationTicker", () => ({
  useDurationTicker: jest.fn((base, isActive) =>
    isActive && typeof base === "number" && base > 0 ? "02:30:45" : "00:00:00"
  ),
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

  it("should display duration when status is ON and statusDurationSeconds is provided", () => {
    render(
      <StatusIndicatorCard
        {...defaultProps}
        isOn={true}
        statusDurationSeconds={9045}
      />
    );

    expect(screen.getByText("02:30:45")).toBeInTheDocument();
  });

  it("should not display the active duration when status is OFF without a base", () => {
    render(
      <StatusIndicatorCard
        {...defaultProps}
        isOn={false}
        onStartTime="2024-01-01T10:00:00Z"
      />
    );

    // Sin statusDurationSeconds, el ticker devuelve 00:00:00 (no la duración activa).
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

  it("should render edit and delete buttons when showActions is true", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    const editButton = screen.getByLabelText("Editar");
    const deleteButton = screen.getByLabelText("Eliminar");

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it("should not render action buttons when showActions is false", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={false}
      />
    );

    const editButton = screen.queryByLabelText("Editar");
    const deleteButton = screen.queryByLabelText("Eliminar");

    expect(editButton).not.toBeInTheDocument();
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    const editButton = screen.getByLabelText("Editar");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    const deleteButton = screen.getByLabelText("Eliminar");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it("should only render edit button when onDelete is not provided", () => {
    const mockOnEdit = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onEdit={mockOnEdit}
        showActions={true}
      />
    );

    const editButton = screen.getByLabelText("Editar");
    const deleteButton = screen.queryByLabelText("Eliminar");

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("should only render delete button when onEdit is not provided", () => {
    const mockOnDelete = jest.fn();
    render(
      <StatusIndicatorCard
        {...defaultProps}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    const editButton = screen.queryByLabelText("Editar");
    const deleteButton = screen.getByLabelText("Eliminar");

    expect(editButton).not.toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});
