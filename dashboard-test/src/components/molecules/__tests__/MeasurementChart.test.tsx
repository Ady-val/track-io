import { render } from "@/test-utils/custom-render";
import type { MeasurementType } from "@/types/dashboard";

import { MeasurementChart } from "../MeasurementChart";

// Mock de los componentes de gráficos
jest.mock("../GaugeChart", () => ({
  GaugeChart: ({
    title,
    type,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="gauge-chart">
      {title} - {type}
      {showActions && onEdit && (
        <button data-testid="gauge-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="gauge-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

jest.mock("../HorizontalBarChart", () => ({
  HorizontalBarChart: ({
    title,
    type,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="horizontal-bar-chart">
      {title} - {type}
      {showActions && onEdit && (
        <button data-testid="bar-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="bar-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

jest.mock("../VibrationLineChart", () => ({
  VibrationLineChart: ({
    title,
    type,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="vibration-line-chart">
      {title} - {type}
      {showActions && onEdit && (
        <button data-testid="vibration-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="vibration-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

jest.mock("../StatusIndicatorCard", () => ({
  StatusIndicatorCard: ({
    title,
    type,
    isOn,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    isOn?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="status-indicator-card">
      {title} - {type} - {isOn ? "ON" : "OFF"}
      {showActions && onEdit && (
        <button data-testid="status-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="status-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

jest.mock("../LiquidFillGauge", () => ({
  LiquidFillGauge: ({
    title,
    type,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="liquid-fill-gauge">
      {title} - {type}
      {showActions && onEdit && (
        <button data-testid="liquid-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="liquid-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

jest.mock("../DewPointDonutChart", () => ({
  DewPointDonutChart: ({
    title,
    type,
    onEdit,
    onDelete,
    showActions,
  }: {
    title: string;
    type: string;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
  }) => (
    <div data-testid="dew-point-donut-chart">
      {title} - {type}
      {showActions && onEdit && (
        <button data-testid="dew-point-edit-button" onClick={onEdit}>
          Edit
        </button>
      )}
      {showActions && onDelete && (
        <button data-testid="dew-point-delete-button" onClick={onDelete}>
          Delete
        </button>
      )}
    </div>
  ),
}));

describe("MeasurementChart", () => {
  const defaultProps = {
    title: "Test Chart",
    subtitle: "Test Subtitle",
    value: 50,
    minValue: 0,
    maxValue: 100,
    type: "temperature" as MeasurementType,
  };

  it("should render GaugeChart for temperature type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="temperature" />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
    expect(getByTestId("gauge-chart")).toHaveTextContent(
      "Test Chart - temperature"
    );
  });

  it("should render LiquidFillGauge for humidity type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="humidity" />
    );

    expect(getByTestId("liquid-fill-gauge")).toBeInTheDocument();
    expect(getByTestId("liquid-fill-gauge")).toHaveTextContent(
      "Test Chart - humidity"
    );
  });

  it("should render LiquidFillGauge for ppm type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="ppm" />
    );

    expect(getByTestId("liquid-fill-gauge")).toBeInTheDocument();
    expect(getByTestId("liquid-fill-gauge")).toHaveTextContent(
      "Test Chart - ppm"
    );
  });

  it("should render DewPointDonutChart for dew_point type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="dew_point" />
    );

    expect(getByTestId("dew-point-donut-chart")).toBeInTheDocument();
    expect(getByTestId("dew-point-donut-chart")).toHaveTextContent(
      "Test Chart - dew_point"
    );
  });

  it("should render HorizontalBarChart for pressure type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="pressure" />
    );

    expect(getByTestId("horizontal-bar-chart")).toBeInTheDocument();
    expect(getByTestId("horizontal-bar-chart")).toHaveTextContent(
      "Test Chart - pressure"
    );
  });

  it("should render GaugeChart for flow type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="flow" />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
    expect(getByTestId("gauge-chart")).toHaveTextContent("Test Chart - flow");
  });

  it("should render GaugeChart for level type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="level" />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
    expect(getByTestId("gauge-chart")).toHaveTextContent("Test Chart - level");
  });

  it("should render VibrationLineChart for vibration type", () => {
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        history={[1, 2, 3, 4, 5]}
        type="vibration"
      />
    );

    expect(getByTestId("vibration-line-chart")).toBeInTheDocument();
    expect(getByTestId("vibration-line-chart")).toHaveTextContent(
      "Test Chart - vibration"
    );
  });

  it("should render default GaugeChart for unknown type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type={"unknown" as MeasurementType} />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
  });

  it("should pass all props to GaugeChart", () => {
    const props = {
      ...defaultProps,
      timestamp: "2024-01-01T00:00:00Z",
    };

    const { getByTestId } = render(
      <MeasurementChart {...props} type="temperature" />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
  });

  it("should pass history to VibrationLineChart", () => {
    const history = [10, 20, 30, 40, 50];
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} history={history} type="vibration" />
    );

    expect(getByTestId("vibration-line-chart")).toBeInTheDocument();
  });

  it("should handle undefined value", () => {
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="temperature"
        value={undefined}
      />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
  });

  it("should render StatusIndicatorCard for status type", () => {
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="status"
        value={true}
        onStartTime="2024-01-01T00:00:00Z"
      />
    );

    expect(getByTestId("status-indicator-card")).toBeInTheDocument();
    expect(getByTestId("status-indicator-card")).toHaveTextContent(
      "Test Chart - status - ON"
    );
  });

  it("should render StatusIndicatorCard with OFF status", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="status" value={false} />
    );

    expect(getByTestId("status-indicator-card")).toBeInTheDocument();
    expect(getByTestId("status-indicator-card")).toHaveTextContent(
      "Test Chart - status - OFF"
    );
  });

  it("should pass onStartTime to StatusIndicatorCard", () => {
    const onStartTime = "2024-01-01T10:00:00Z";
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="status"
        value={true}
        onStartTime={onStartTime}
      />
    );

    expect(getByTestId("status-indicator-card")).toBeInTheDocument();
  });

  it("should pass onEdit and onDelete to child components when showActions is true", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="temperature"
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
    expect(getByTestId("gauge-edit-button")).toBeInTheDocument();
    expect(getByTestId("gauge-delete-button")).toBeInTheDocument();
  });

  it("should not show action buttons when showActions is false", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const { queryByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="temperature"
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={false}
      />
    );

    expect(queryByTestId("gauge-edit-button")).not.toBeInTheDocument();
    expect(queryByTestId("gauge-delete-button")).not.toBeInTheDocument();
  });

  it("should pass onEdit and onDelete to HorizontalBarChart", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="pressure"
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    expect(getByTestId("horizontal-bar-chart")).toBeInTheDocument();
    expect(getByTestId("bar-edit-button")).toBeInTheDocument();
    expect(getByTestId("bar-delete-button")).toBeInTheDocument();
  });

  it("should pass onEdit and onDelete to VibrationLineChart", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="vibration"
        history={[1, 2, 3]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    expect(getByTestId("vibration-line-chart")).toBeInTheDocument();
    expect(getByTestId("vibration-edit-button")).toBeInTheDocument();
    expect(getByTestId("vibration-delete-button")).toBeInTheDocument();
  });

  it("should pass onEdit and onDelete to StatusIndicatorCard", () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <MeasurementChart
        {...defaultProps}
        type="status"
        value={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        showActions={true}
      />
    );

    expect(getByTestId("status-indicator-card")).toBeInTheDocument();
    expect(getByTestId("status-edit-button")).toBeInTheDocument();
    expect(getByTestId("status-delete-button")).toBeInTheDocument();
  });
});
