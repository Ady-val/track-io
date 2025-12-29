import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test-utils/custom-render";

import { DataTable, type TableColumn } from "../DataTable";

interface TestData {
  id: number;
  name: string;
  email: string;
  age: number;
}

describe("DataTable", () => {
  const mockData: TestData[] = [
    { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35 },
  ];

  const columns: Array<TableColumn<TestData>> = [
    { id: "name", label: "Name", key: "name" },
    { id: "email", label: "Email", key: "email" },
    { id: "age", label: "Age", key: "age" },
  ];

  it("should render table with data", () => {
    render(<DataTable columns={columns} data={mockData} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
  });

  it("should render loading state", () => {
    const { container } = render(
      <DataTable loading columns={columns} data={[]} />
    );

    const spinner = container.querySelector(".animate-spin");

    expect(spinner).toBeInTheDocument();
  });

  it("should render empty message when no data", () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
  });

  it("should render custom empty message", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No se encontraron registros"
      />
    );

    expect(screen.getByText("No se encontraron registros")).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();

    const { container } = render(
      <DataTable columns={columns} data={mockData} onEdit={handleEdit} />
    );

    // Buscar la fila que contiene "John Doe"
    const johnDoeRow = Array.from(container.querySelectorAll("tr")).find(
      (row) => row.textContent?.includes("John Doe")
    );

    expect(johnDoeRow).toBeTruthy();

    // Buscar el botón de editar dentro de esa fila
    const editButton = johnDoeRow?.querySelector("button");

    expect(editButton).toBeTruthy();

    if (editButton) {
      // Con disableRipple, el click debería funcionar correctamente
      await user.click(editButton as HTMLElement);

      expect(handleEdit).toHaveBeenCalledWith(mockData[0]);
      expect(handleEdit).toHaveBeenCalledTimes(1);
    }
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const handleDelete = jest.fn();

    const { container } = render(
      <DataTable columns={columns} data={mockData} onDelete={handleDelete} />
    );

    // Buscar la fila que contiene "John Doe"
    const johnDoeRow = Array.from(container.querySelectorAll("tr")).find(
      (row) => row.textContent?.includes("John Doe")
    );

    expect(johnDoeRow).toBeTruthy();

    // Buscar el botón de eliminar dentro de esa fila
    const deleteButton = johnDoeRow?.querySelector("button");

    expect(deleteButton).toBeTruthy();

    if (deleteButton) {
      // Con disableRipple, el click debería funcionar correctamente
      await user.click(deleteButton as HTMLElement);

      expect(handleDelete).toHaveBeenCalledWith(mockData[0]);
      expect(handleDelete).toHaveBeenCalledTimes(1);
    }
  });

  it("should render custom component for column", () => {
    const customColumns: Array<TableColumn<TestData>> = [
      {
        id: "name",
        label: "Name",
        key: "name",
        component: (value) => (
          <span data-testid="custom-name">{String(value)}</span>
        ),
      },
    ];

    render(<DataTable columns={customColumns} data={mockData} />);

    expect(screen.getAllByTestId("custom-name")).toHaveLength(3);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should not render actions column when onEdit and onDelete are not provided", () => {
    render(<DataTable columns={columns} data={mockData} />);

    expect(screen.queryByText("Acciones")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DataTable className="custom-class" columns={columns} data={mockData} />
    );

    const tableContainer = container.querySelector(".custom-class");

    expect(tableContainer).toBeInTheDocument();
  });

  it("should apply maxHeight when provided", () => {
    const { container } = render(
      <DataTable columns={columns} data={mockData} maxHeight="max-h-96" />
    );

    const tableContainer = container.querySelector(".max-h-96");

    expect(tableContainer).toBeInTheDocument();
  });

  it("should render columns with width", () => {
    const columnsWithWidth: Array<TableColumn<TestData>> = [
      { id: "name", label: "Name", key: "name", width: "200px" },
      { id: "email", label: "Email", key: "email", width: "300px" },
    ];

    render(<DataTable columns={columnsWithWidth} data={mockData} />);

    const headers = screen.getAllByRole("columnheader");

    expect(headers[0]).toHaveStyle({ width: "200px" });
    expect(headers[1]).toHaveStyle({ width: "300px" });
  });

  it("should handle undefined values in data", () => {
    const dataWithUndefined: TestData[] = [
      { id: 1, name: "John", email: "john@example.com", age: 30 },
      { id: 2, name: "Jane", email: undefined as unknown as string, age: 25 },
    ];

    render(<DataTable columns={columns} data={dataWithUndefined} />);

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });
});
