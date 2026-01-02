import { render, screen } from "@/test-utils/custom-render";

import { ErrorMessage } from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("should not render when message is empty", () => {
    const { container } = render(<ErrorMessage message="" />);

    expect(container.firstChild).toBeNull();
  });

  it("should render message when provided", () => {
    render(<ErrorMessage message="Something went wrong" />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render custom title", () => {
    render(
      <ErrorMessage title="Custom Error Title" message="Error message" />
    );

    expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("should use default title for generic type", () => {
    render(<ErrorMessage message="Error message" type="generic" />);

    expect(screen.getByText("Error:")).toBeInTheDocument();
  });

  it("should use default title for validation type", () => {
    render(<ErrorMessage message="Error message" type="validation" />);

    expect(screen.getByText("Errores de validación:")).toBeInTheDocument();
  });

  it("should use default title for server type", () => {
    render(<ErrorMessage message="Error message" type="server" />);

    expect(screen.getByText("Error:")).toBeInTheDocument();
  });

  it("should use server error title when isServerError is true", () => {
    render(
      <ErrorMessage
        message="Server error"
        type="server"
        isServerError={true}
      />
    );

    expect(screen.getByText("Error del servidor:")).toBeInTheDocument();
  });

  it("should have role alert and aria-live assertive", () => {
    render(<ErrorMessage message="Error message" />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute("aria-live", "assertive");
  });

  it("should use custom id", () => {
    render(<ErrorMessage message="Error message" id="custom-error-id" />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveAttribute("id", "custom-error-id");
  });

  it("should apply custom className", () => {
    render(
      <ErrorMessage message="Error message" className="custom-class" />
    );

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveClass("custom-class");
  });

  it("should render ReactNode message", () => {
    render(
      <ErrorMessage
        message={<span data-testid="custom-message">Custom message node</span>}
      />
    );

    expect(screen.getByTestId("custom-message")).toBeInTheDocument();
    expect(screen.getByText("Custom message node")).toBeInTheDocument();
  });
});

