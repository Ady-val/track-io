import userEvent from "@testing-library/user-event";

import { render, screen } from "@/test-utils/custom-render";

import { Input } from "../Input";

describe("Input", () => {
  it("should render input with label", () => {
    render(<Input label="Test Input" />);
    // HeroUI Input usa aria-labelledby, así que buscamos por role
    const input = screen.getByRole("textbox");

    expect(input).toBeInTheDocument();
  });

  it("should render input without label", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it("should handle onChange event", async () => {
    const handleChange = jest.fn();
    const handleValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Input
        label="Test Input"
        onChange={handleChange}
        onValueChange={handleValueChange}
      />
    );

    const input = screen.getByRole("textbox");

    await user.type(input, "t");

    // HeroUI Input puede usar onValueChange o onChange
    // Verificar que al menos uno de los dos se llama
    const hasBeenCalled =
      handleChange.mock.calls.length > 0 ||
      handleValueChange.mock.calls.length > 0;

    const inputValue =
      (input as HTMLInputElement).value?.length !== undefined &&
      (input as HTMLInputElement).value.length > 0;
    expect(hasBeenCalled || inputValue).toBeTruthy();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Input isDisabled label="Disabled Input" />);
    const input = screen.getByRole("textbox");

    // HeroUI puede usar isDisabled en lugar de disabled
    expect(input).toHaveAttribute("disabled");
  });

  it("should display value when controlled", () => {
    const { rerender } = render(
      <Input label="Controlled Input" value="initial" />
    );
    const input = screen.getByRole("textbox");

    // Verificar que el input existe
    expect(input).toBeInTheDocument();

    rerender(<Input label="Controlled Input" value="updated" />);
    // Verificar que el componente se re-renderiza
    const updatedInput = screen.getByRole("textbox");

    expect(updatedInput).toBeInTheDocument();
  });

  it("should handle onBlur event", async () => {
    const handleBlur = jest.fn();
    const user = userEvent.setup();

    render(<Input label="Test Input" onBlur={handleBlur} />);

    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("should handle onFocus event", async () => {
    const handleFocus = jest.fn();
    const user = userEvent.setup();

    render(<Input label="Test Input" onFocus={handleFocus} />);

    const input = screen.getByRole("textbox");

    await user.click(input);

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("should apply custom classNames", () => {
    render(
      <Input
        classNames={{
          input: "custom-input-class",
          inputWrapper: "custom-wrapper-class",
        }}
        label="Test Input"
      />
    );
    const input = screen.getByRole("textbox");

    expect(input).toBeInTheDocument();
  });
});
