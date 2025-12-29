import { render } from "@/test-utils/custom-render";
import type { MeasurementType } from "@/types/dashboard";

import { MeasurementChart } from "../MeasurementChart";

// Mock de los componentes de gráficos
jest.mock("../GaugeChart", () => ({
  GaugeChart: ({ title, type }: { title: string; type: string }) => (
    <div data-testid="gauge-chart">
      {title} - {type}
    </div>
  ),
}));

jest.mock("../HorizontalBarChart", () => ({
  HorizontalBarChart: ({ title, type }: { title: string; type: string }) => (
    <div data-testid="horizontal-bar-chart">
      {title} - {type}
    </div>
  ),
}));

jest.mock("../VibrationLineChart", () => ({
  VibrationLineChart: ({ title, type }: { title: string; type: string }) => (
    <div data-testid="vibration-line-chart">
      {title} - {type}
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

  it("should render GaugeChart for humidity type", () => {
    const { getByTestId } = render(
      <MeasurementChart {...defaultProps} type="humidity" />
    );

    expect(getByTestId("gauge-chart")).toBeInTheDocument();
    expect(getByTestId("gauge-chart")).toHaveTextContent(
      "Test Chart - humidity"
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
});
