import { render, screen } from "@/test-utils/custom-render";
import { createMockDevice } from "@/test-utils/mock-data";

import { DevicesTable } from "../DevicesTable";

// Mock de useHasPermission - retorna true por defecto para simplificar tests
jest.mock("@/hooks/useHasPermission", () => ({
  useHasPermission: jest.fn(() => true),
}));

describe("DevicesTable", () => {
  const mockDevices = [
    createMockDevice({
      id: 1,
      name: "Device 1",
      areaName: "Area 1",
      externalId: "EXT-001",
      deviceSignals: [],
    }),
  ];

  it("should render loading state when loading is true", () => {
    render(<DevicesTable data={[]} loading={true} />);

    expect(screen.getByText("Cargando dispositivos...")).toBeInTheDocument();
  });

  it("should render table with data", () => {
    const { container } = render(<DevicesTable data={mockDevices} />);

    // Verificar que hay una tabla
    const table = container.querySelector("table");

    expect(table).toBeInTheDocument();

    // Verificar que el contenido del dispositivo está presente
    expect(container.textContent).toContain("Device 1");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DevicesTable data={mockDevices} className="custom-class" />
    );

    const tableContainer = container.querySelector(".custom-class");

    expect(tableContainer).toBeInTheDocument();
  });
});

