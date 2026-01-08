import React from "react";
import userEvent from "@testing-library/user-event";

import { render, screen, waitFor } from "@/test-utils/custom-render";
import { createMockDashboardMeasurement } from "@/test-utils/mock-data";

import { DeleteDashboardMeasurementModal } from "../DeleteDashboardMeasurementModal";

// Mock de HeroUI Button directamente para evitar problemas con onRipplePressHandler
jest.mock("@heroui/button", () => {
  const React = require("react");
  return {
    Button: React.forwardRef<HTMLButtonElement, any>(
      ({ children, className, onPress, disabled, isLoading, ...props }, ref) => {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          if (onPress && !disabled && !isLoading && typeof onPress === "function") {
            // HeroUI usa onPress que recibe el evento o un PressEvent
            onPress(e as any);
          }
        };

        return (
          <button
            ref={ref}
            className={className}
            disabled={disabled || isLoading}
            onClick={handleClick}
            type="button"
            data-testid="heroui-button"
            {...props}
          >
            {/* Renderizar children tal cual - el componente ya maneja el texto cuando isLoading es true */}
            {children}
          </button>
        );
      }
    ),
  };
});

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
    // Button ya está mockeado desde @heroui/button, así que no necesitamos mockearlo aquí
  };
});

describe("DeleteDashboardMeasurementModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockDashboard = createMockDashboardMeasurement({
    id: 1,
    name: "Test Measurement",
    externalId: "TEST-001",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when isOpen is true and dashboard is provided", async () => {
    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Esperar a que el modal y su contenido se rendericen completamente
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Verificar que el modal está renderizado con su contenido
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    // Hay dos elementos con texto similar (título y pregunta), así que usamos queries más específicas
    await waitFor(
      () => {
        // Verificar el título del modal (buscamos exactamente el texto del título)
        expect(
          screen.getByText("Eliminar Dashboard Measurement", { exact: true })
        ).toBeInTheDocument();
        // Verificar la pregunta (buscamos exactamente el texto de la pregunta)
        expect(
          screen.getByText("¿Eliminar Dashboard Measurement?", { exact: true })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should not render modal when isOpen is false", () => {
    render(
      <DeleteDashboardMeasurementModal
        isOpen={false}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // El modal no debería estar visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not render modal when dashboard is null", () => {
    const { container } = render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={null}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // El modal no debería estar visible cuando dashboard es null
    expect(container.firstChild).toBeNull();
  });

  it("should call onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Esperar a que los botones se rendericen completamente
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("should call onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Esperar a que los botones se rendericen completamente
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockDashboard.id);
    });
  });

  it("should display dashboard information", async () => {
    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Verificar que se muestra la información del dashboard
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByText(/nombre:/i)).toBeInTheDocument();
        expect(screen.getByText(/external id:/i)).toBeInTheDocument();
        expect(screen.getByText(mockDashboard.measurement.name)).toBeInTheDocument();
        expect(
          screen.getByText(mockDashboard.measurement.externalId)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should show loading state when deleting", async () => {
    const user = userEvent.setup();
    let resolveConfirm: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    mockOnConfirm.mockReturnValue(confirmPromise);

    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Esperar a que los botones se rendericen completamente
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteButton);

    // Verificar que el botón muestra estado de carga
    await waitFor(() => {
      expect(screen.getByText(/eliminando.../i)).toBeInTheDocument();
    });

    // Resolver la promesa
    resolveConfirm!();
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it("should disable buttons during deletion", async () => {
    const user = userEvent.setup();
    let resolveConfirm: () => void;
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    mockOnConfirm.mockReturnValue(confirmPromise);

    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Esperar a que los botones se rendericen completamente
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteButton);

    // Verificar que los botones están deshabilitados durante la carga
    await waitFor(() => {
      const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
      expect(cancelBtn).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    // Resolver la promesa
    resolveConfirm!();
  });

  it("should call onClose after successful deletion", async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <DeleteDashboardMeasurementModal
        isOpen={true}
        dashboard={mockDashboard}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Esperar a que los botones se rendericen completamente
    // El contenido puede estar dentro de componentes de HeroUI que tardan en renderizarse
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const deleteButton = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockDashboard.id);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
