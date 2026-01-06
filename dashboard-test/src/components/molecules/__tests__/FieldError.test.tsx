import { render, screen } from "@/test-utils/custom-render";

import { FieldError } from "../FieldError";

describe("FieldError", () => {
  it("should not render when error is not provided", () => {
    const { container } = render(<FieldError />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when error is empty string", () => {
    const { container } = render(<FieldError error="" />);

    expect(container.firstChild).toBeNull();
  });

  it("should render error message when error is provided", () => {
    render(<FieldError error="This field is required" />);

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("should have role alert and aria-live polite", () => {
    render(<FieldError error="Error message" />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute("aria-live", "polite");
  });

  it("should use fieldId for id attribute", () => {
    render(<FieldError error="Error message" fieldId="test-field" />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveAttribute("id", "test-field-error");
  });

  it("should apply custom className", () => {
    render(<FieldError error="Error message" className="custom-class" />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveClass("custom-class");
  });

  it("should render ReactNode error", () => {
    render(
      <FieldError
        error={<span data-testid="custom-error">Custom error node</span>}
      />
    );

    expect(screen.getByTestId("custom-error")).toBeInTheDocument();
    expect(screen.getByText("Custom error node")).toBeInTheDocument();
  });
});
