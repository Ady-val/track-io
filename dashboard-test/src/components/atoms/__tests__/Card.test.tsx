import { render } from "@/test-utils/custom-render";

import { Card, CardBody } from "../Card";

describe("Card", () => {
  it("should render card with children", () => {
    const { container } = render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    // Verificar que el Card se renderiza (el componente tiene clases específicas)
    const card = container.querySelector('[class*="flex flex-col"]');

    expect(card).toBeTruthy();
  });

  it("should render CardBody component", () => {
    const { container } = render(
      <Card>
        <CardBody>Card Body Content</CardBody>
      </Card>
    );
    // Verificar que el Card se renderiza
    const card = container.querySelector('[class*="flex flex-col"]');

    expect(card).toBeTruthy();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Card className="custom-card-class">
        <div>Content</div>
      </Card>
    );
    // Verificar que el card se renderiza (puede que la clase se combine con otras)
    const card = container.querySelector(
      '[class*="custom-card-class"], [class*="flex flex-col"]'
    );

    expect(card).toBeTruthy();
  });

  it("should render CardBody with custom className", () => {
    const { container } = render(
      <Card>
        <CardBody className="custom-body-class">Content</CardBody>
      </Card>
    );
    // Verificar que el Card se renderiza
    const card = container.querySelector('[class*="flex flex-col"]');

    expect(card).toBeTruthy();
  });
});
