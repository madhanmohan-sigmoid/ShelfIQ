import React from "react";
import { render, screen } from "@testing-library/react";
import MassUpdate from "../MassUpdate";

jest.mock("../../components/massUpdate/MassUpdateContainer", () => {
  const MassUpdateContainerMock = () => (
    <div data-testid="mass-update-container">Mass Update Container</div>
  );
  MassUpdateContainerMock.displayName = "MassUpdateContainerMock";
  return MassUpdateContainerMock;
});

describe("MassUpdate", () => {
  it("renders MassUpdateContainer", () => {
    render(<MassUpdate />);
    expect(screen.getByTestId("mass-update-container")).toBeInTheDocument();
    expect(screen.getByText("Mass Update Container")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<MassUpdate />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
