import { render, screen, fireEvent } from "@/test-utils/custom-render";
import type { DashboardAreaData } from "@/types/dashboard";

import { AreaCard } from "../AreaCard";

describe("AreaCard", () => {
  const mockArea: DashboardAreaData = {
    area: "Test Area",
    eventsTime: "1h 23m 45s",
    departments: [],
  };

  it("should render area name", () => {
    render(<AreaCard area={mockArea} />);

    expect(screen.getByText("Test Area")).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", () => {
    const handleClick = jest.fn();

    render(<AreaCard area={mockArea} onClick={handleClick} />);

    const card = screen.getByRole("button");

    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Enter key is pressed", () => {
    const handleClick = jest.fn();

    render(<AreaCard area={mockArea} onClick={handleClick} />);

    const card = screen.getByRole("button");

    fireEvent.keyDown(card, { key: "Enter" });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Space key is pressed", () => {
    const handleClick = jest.fn();

    render(<AreaCard area={mockArea} onClick={handleClick} />);

    const card = screen.getByRole("button");

    fireEvent.keyDown(card, { key: " " });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should display events time when there are active departments", () => {
    const areaWithDepartments: DashboardAreaData = {
      area: "Test Area",
      eventsTime: "2h 30m 15s",
      departments: [
        { department: "Dept 1", status: "alert" },
        { department: "Dept 2", status: "warning" },
      ],
    };

    render(<AreaCard area={areaWithDepartments} />);

    expect(screen.getByText("2h 30m 15s")).toBeInTheDocument();
  });

  it("should not display events time when there are no active departments", () => {
    render(<AreaCard area={mockArea} />);

    expect(screen.queryByText("1h 23m 45s")).not.toBeInTheDocument();
  });

  it("should display active departments", () => {
    const areaWithDepartments: DashboardAreaData = {
      area: "Test Area",
      eventsTime: "1h 0m 0s",
      departments: [
        { department: "Department A", status: "alert" },
        { department: "Department B", status: "warning" },
      ],
    };

    render(<AreaCard area={areaWithDepartments} />);

    expect(screen.getByText("Department A")).toBeInTheDocument();
    expect(screen.getByText("Department B")).toBeInTheDocument();
  });

  it("should apply border color based on status", () => {
    const getAreaEventStatus = jest.fn(() => ({
      status: "alert" as const,
      hasOpenEvents: true,
    }));

    const { container } = render(
      <AreaCard area={mockArea} getAreaEventStatus={getAreaEventStatus} />
    );

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("border-red-500");
  });

  it("should show ok status border when status is ok", () => {
    const getAreaEventStatus = jest.fn(() => ({
      status: "ok" as const,
      hasOpenEvents: false,
    }));

    const { container } = render(
      <AreaCard area={mockArea} getAreaEventStatus={getAreaEventStatus} />
    );

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("border-green-500");
  });

  it("should show warning status border when status is warning", () => {
    const getAreaEventStatus = jest.fn(() => ({
      status: "warning" as const,
      hasOpenEvents: false,
    }));

    const { container } = render(
      <AreaCard area={mockArea} getAreaEventStatus={getAreaEventStatus} />
    );

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("border-yellow-500");
  });

  it("should apply custom className", () => {
    const { container } = render(
      <AreaCard area={mockArea} className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass("custom-class");
  });

  it("should have proper aria-label", () => {
    const areaWithDepartments: DashboardAreaData = {
      area: "Test Area",
      eventsTime: "1h 0m 0s",
      departments: [{ department: "Dept 1", status: "alert" }],
    };

    render(<AreaCard area={areaWithDepartments} />);

    const card = screen.getByRole("button");

    expect(card).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Test Area")
    );
    expect(card).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Tiempo acumulado")
    );
  });

  it("should filter only active departments", () => {
    const areaWithMixedDepartments: DashboardAreaData = {
      area: "Test Area",
      eventsTime: "1h 0m 0s",
      departments: [
        { department: "Active Dept", status: "alert" },
        { department: "Inactive Dept", status: "ok" },
        { department: "Warning Dept", status: "warning" },
      ],
    };

    render(<AreaCard area={areaWithMixedDepartments} />);

    expect(screen.getByText("Active Dept")).toBeInTheDocument();
    expect(screen.getByText("Warning Dept")).toBeInTheDocument();
    expect(screen.queryByText("Inactive Dept")).not.toBeInTheDocument();
  });
});
