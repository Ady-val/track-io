import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test-utils/custom-render";
import { createMockAlertRule } from "@/test-utils/mock-data";

import { AlertRuleDetailModal } from "../AlertRuleDetailModal";

// Mock de useHasPermission
jest.mock("@/hooks/useHasPermission", () => ({
  useHasPermission: jest.fn(() => true),
}));

describe("AlertRuleDetailModal", () => {
  const mockRule = createMockAlertRule({
    id: "1",
    name: "Test Alert Rule",
    measurementId: 1,
    mode: "setpoint",
    operator: ">",
    setpoint: 100,
    isEnabled: true,
  });

  const mockSensors = [
    {
      id: 1,
      name: "Temperature Sensor",
      externalId: "TEMP-001",
      type: "temperature" as const,
      status: "active" as const,
    },
  ];

  const mockSensorTypes = [
    {
      value: "temperature" as const,
      label: "Temperature",
      icon: jest.fn(),
      color: "red",
    },
  ];

  const mockOperators = [
    { value: ">", label: "Greater than" },
    { value: "<", label: "Less than" },
  ];

  const mockGruposMensajes: any[] = [];
  const mockReceptores: any[] = [];
  const mockUsuariosCorreo: any[] = [];
  const mockColoresTorreta: string[] = [];

  const mockGetSensorIcon = jest.fn(() => <div>Icon</div>);
  const mockGetColorValue = jest.fn(() => "#FF0000");

  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleEnabled = jest.fn();
  const mockOnCreateMessage = jest.fn();
  const mockOnDeleteMessage = jest.fn();
  const mockOnDuplicateMessage = jest.fn();
  const mockOnUpdateMessage = jest.fn();

  const defaultProps = {
    isOpen: true,
    rule: mockRule,
    sensors: mockSensors,
    sensorTypes: mockSensorTypes,
    operators: mockOperators,
    gruposMensajes: mockGruposMensajes,
    receptores: mockReceptores,
    usuariosCorreo: mockUsuariosCorreo,
    coloresTorreta: mockColoresTorreta,
    getSensorIcon: mockGetSensorIcon,
    getColorValue: mockGetColorValue,
    onClose: mockOnClose,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onToggleEnabled: mockOnToggleEnabled,
    onCreateMessage: mockOnCreateMessage,
    onDeleteMessage: mockOnDeleteMessage,
    onDuplicateMessage: mockOnDuplicateMessage,
    onUpdateMessage: mockOnUpdateMessage,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when rule is null", () => {
    const { container } = render(
      <AlertRuleDetailModal {...defaultProps} rule={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when rule is provided and isOpen is true", () => {
    render(<AlertRuleDetailModal {...defaultProps} />);

    // Verificar que el modal está renderizado (backdrop visible)
    expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(<AlertRuleDetailModal {...defaultProps} isOpen={false} />);

    // El modal no debería estar visible
    expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();

    render(<AlertRuleDetailModal {...defaultProps} />);

    const backdrop = screen.getByLabelText(/close modal/i);

    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
