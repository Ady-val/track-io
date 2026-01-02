import { render, screen } from "@/test-utils/custom-render";

import { ValidationErrorList } from "../ValidationErrorList";

describe("ValidationErrorList", () => {
  it("should not render when errors array is empty", () => {
    const { container } = render(<ValidationErrorList errors={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render list of errors", () => {
    const errors = [
      "Name is required",
      "Email must be valid",
      "Password is too short",
    ];

    render(<ValidationErrorList errors={errors} />);

    errors.forEach((error) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  it("should use default title", () => {
    render(<ValidationErrorList errors={["Error 1"]} />);

    expect(screen.getByText("Errores de validación:")).toBeInTheDocument();
  });

  it("should use custom title", () => {
    render(
      <ValidationErrorList
        errors={["Error 1"]}
        title="Custom Validation Errors:"
      />
    );

    expect(
      screen.getByText("Custom Validation Errors:")
    ).toBeInTheDocument();
  });

  it("should have role alert and aria-live polite", () => {
    render(<ValidationErrorList errors={["Error 1"]} />);

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute("aria-live", "polite");
  });

  it("should use custom id", () => {
    render(
      <ValidationErrorList errors={["Error 1"]} id="custom-validation-id" />
    );

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveAttribute("id", "custom-validation-id");
  });

  it("should apply custom className", () => {
    render(
      <ValidationErrorList errors={["Error 1"]} className="custom-class" />
    );

    const errorElement = screen.getByRole("alert");

    expect(errorElement).toHaveClass("custom-class");
  });

  it("should render errors as list items", () => {
    const errors = ["Error 1", "Error 2"];

    render(<ValidationErrorList errors={errors} />);

    const listItems = screen.getAllByRole("listitem");

    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent("Error 1");
    expect(listItems[1]).toHaveTextContent("Error 2");
  });

  it("should render ReactNode errors", () => {
    render(
      <ValidationErrorList
        errors={[
          <span key="1" data-testid="error-1">
            Error 1
          </span>,
          <span key="2" data-testid="error-2">
            Error 2
          </span>,
        ]}
      />
    );

    expect(screen.getByTestId("error-1")).toBeInTheDocument();
    expect(screen.getByTestId("error-2")).toBeInTheDocument();
  });
});

