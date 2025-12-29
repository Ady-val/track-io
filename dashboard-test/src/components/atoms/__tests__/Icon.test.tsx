import { render } from "@/test-utils/custom-render";

import { Icon } from "../Icon";

describe("Icon", () => {
  it("should render icon with valid name", () => {
    const { container } = render(<Icon name="edit" />);
    const icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();
  });

  it("should render different icon sizes", () => {
    const { rerender, container } = render(<Icon name="edit" size="xs" />);
    let icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();

    rerender(<Icon name="edit" size="sm" />);
    icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();

    rerender(<Icon name="edit" size="lg" />);
    icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<Icon className="custom-class" name="edit" />);
    const icon = container.querySelector("svg");

    expect(icon).toHaveClass("custom-class");
  });

  it("should apply custom color", () => {
    const { container } = render(<Icon color="text-blue-500" name="edit" />);
    const icon = container.querySelector("svg");

    expect(icon).toHaveClass("text-blue-500");
  });

  it("should render different icon types", () => {
    const { rerender, container } = render(<Icon name="edit" />);
    let icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();

    rerender(<Icon name="trash" />);
    icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();

    rerender(<Icon name="building" />);
    icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should return null and warn when icon name is invalid", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
    const { container } = render(<Icon name="invalid-icon" />);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Icon "invalid-icon" not found');

    consoleSpy.mockRestore();
  });
});
