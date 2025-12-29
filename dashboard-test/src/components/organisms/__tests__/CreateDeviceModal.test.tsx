import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test-utils/custom-render";

import { CreateDeviceModal } from "../CreateDeviceModal";

// Mock de useAreas hook usado por CreateDeviceForm
jest.mock("@/hooks/useAreas", () => ({
  useAreas: jest.fn(() => ({
    areas: [
      { id: 1, name: "Area 1" },
      { id: 2, name: "Area 2" },
    ],
    loading: false,
    error: null,
  })),
}));

describe("CreateDeviceModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when isOpen is true", () => {
    render(
      <CreateDeviceModal
        isOpen={true}
        externalId="DEV-001"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Verificar que el modal está renderizado (backdrop visible)
    expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument();
  });

  it("should not render modal when isOpen is false", () => {
    render(
      <CreateDeviceModal
        isOpen={false}
        externalId="DEV-001"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // El modal no debería estar visible
    expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CreateDeviceModal
        isOpen={true}
        externalId="DEV-001"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const backdrop = screen.getByLabelText(/close modal/i);

    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
