import { render, screen, fireEvent } from "@/test-utils/custom-render";
import type { DashboardEventData } from "@/types/dashboard";

import { EventsTable } from "../EventsTable";

describe("EventsTable", () => {
  const mockEvents: DashboardEventData[] = [
    {
      id: 1,
      area: "Area 1",
      department: "Department A",
      device: "Device 1",
      signal: "Signal 1",
      status: "open",
      startedAt: new Date("2024-01-15T10:00:00"),
      endedAt: new Date("2024-01-15T12:00:00"),
    },
    {
      id: 2,
      area: "Area 2",
      department: "Department B",
      device: "Device 2",
      signal: "Signal 2",
      status: "closed",
      startedAt: new Date("2024-01-15T14:00:00"),
    },
  ];

  it("should render table with title and event count", () => {
    render(<EventsTable events={mockEvents} title="Eventos Abiertos" />);

    expect(screen.getByText("Eventos Abiertos (2)")).toBeInTheDocument();
  });

  it("should render table headers", () => {
    render(<EventsTable events={mockEvents} title="Test Title" />);

    expect(screen.getByText("Departamento")).toBeInTheDocument();
    expect(screen.getByText("Área")).toBeInTheDocument();
    expect(screen.getByText("Dispositivo")).toBeInTheDocument();
    expect(screen.getByText("Señal")).toBeInTheDocument();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Fin")).toBeInTheDocument();
    expect(screen.getByText("Duración")).toBeInTheDocument();
  });

  it("should render event data", () => {
    render(<EventsTable events={mockEvents} title="Test Title" />);

    expect(screen.getByText("Department A")).toBeInTheDocument();
    expect(screen.getByText("Area 1")).toBeInTheDocument();
    expect(screen.getByText("Device 1")).toBeInTheDocument();
    expect(screen.getByText("Signal 1")).toBeInTheDocument();
    expect(screen.getByText("Department B")).toBeInTheDocument();
  });

  it("should call onEventClick when event row is clicked", () => {
    const handleEventClick = jest.fn();

    render(
      <EventsTable
        events={mockEvents}
        title="Test Title"
        onEventClick={handleEventClick}
      />
    );

    const rows = screen.getAllByRole("row");
    // Skip header row, click first event row
    const firstEventRow = rows[1];

    fireEvent.click(firstEventRow);

    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
    expect(handleEventClick).toHaveBeenCalledTimes(1);
  });

  it("should display empty message when no events", () => {
    render(<EventsTable events={[]} title="Test Title" />);

    expect(screen.getByText("No hay eventos disponibles")).toBeInTheDocument();
    expect(screen.getByText("Test Title (0)")).toBeInTheDocument();
  });

  it("should format timestamps correctly", () => {
    const eventsWithDates: DashboardEventData[] = [
      {
        id: 1,
        area: "Area 1",
        department: "Department A",
        device: "Device 1",
        signal: "Signal 1",
        status: "open",
        startedAt: new Date("2024-01-15T10:30:00"),
        endedAt: new Date("2024-01-15T12:45:00"),
      },
    ];

    const { container } = render(
      <EventsTable events={eventsWithDates} title="Test Title" />
    );

    // Check that formatted dates are displayed (format: DD/MM/YYYY, HH:MM)
    expect(container.textContent).toMatch(/15\/01\/2024/);
  });

  it("should display duration for completed events", () => {
    const eventsWithDuration: DashboardEventData[] = [
      {
        id: 1,
        area: "Area 1",
        department: "Department A",
        device: "Device 1",
        signal: "Signal 1",
        status: "closed",
        startedAt: new Date("2024-01-15T10:00:00"),
        endedAt: new Date("2024-01-15T12:00:00"), // 2 hours
      },
    ];

    render(<EventsTable events={eventsWithDuration} title="Test Title" />);

    expect(screen.getByText("2h 0m 0s")).toBeInTheDocument();
  });

  it("should display 'En curso' for events without end date", () => {
    const ongoingEvent: DashboardEventData[] = [
      {
        id: 1,
        area: "Area 1",
        department: "Department A",
        device: "Device 1",
        signal: "Signal 1",
        status: "open",
        startedAt: new Date("2024-01-15T10:00:00"),
      },
    ];

    render(<EventsTable events={ongoingEvent} title="Test Title" />);

    expect(screen.getByText("En curso")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <EventsTable events={mockEvents} title="Test" className="custom-class" />
    );

    const tableContainer = container.querySelector(".custom-class");

    expect(tableContainer).toBeInTheDocument();
  });
});
