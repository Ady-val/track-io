import { render, screen } from "@/test-utils/custom-render";

import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("should render spinner", () => {
    const { container } = render(<Spinner />);
    // El Spinner de HeroUI se renderiza como un SVG o div con clases específicas
    const spinner = container.querySelector(
      "svg, [data-slot='spinner'], .spinner"
    );

    expect(spinner || container.firstChild).toBeTruthy();
  });

  it("should render with different sizes", () => {
    const { rerender, container } = render(<Spinner size="sm" />);

    expect(container.firstChild).toBeTruthy();

    rerender(<Spinner size="lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("should render with different colors", () => {
    const { rerender, container } = render(<Spinner color="primary" />);

    expect(container.firstChild).toBeTruthy();

    rerender(<Spinner color="secondary" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("should render with label", () => {
    render(<Spinner label="Loading..." />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
