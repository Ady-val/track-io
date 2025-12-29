import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test-utils/custom-render";

import { Button } from "../Button";

describe("Button", () => {
  it("should render button with children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Button disableRipple onClick={handleClick}>
        Click me
      </Button>
    );

    const button = screen.getByRole("button", { name: /click me/i });

    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should render with different variants", () => {
    const { rerender } = render(<Button variant="solid">Solid</Button>);

    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="bordered">Bordered</Button>);
    expect(
      screen.getByRole("button", { name: /bordered/i })
    ).toBeInTheDocument();
  });

  it("should render with different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);

    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button", { name: /large/i })).toBeInTheDocument();
  });

  it("should not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled button/i });

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});
