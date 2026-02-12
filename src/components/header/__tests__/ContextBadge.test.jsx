import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ContextBadge from "../components/ContextBadge";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ContextBadge", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("returns null when there is no value", () => {
    const { container } = render(
      <ContextBadge label="Region" value="" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("navigates to the region page when clicked", () => {
    render(<ContextBadge label="Region" value="North America" />);

    const badge = screen.getByRole("button", { name: /north america/i });
    fireEvent.click(badge);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/region?selected=North%20America"
    );
  });

  it("does not navigate when clickable is false", () => {
    render(
      <ContextBadge
        label="Region"
        value="North America"
        clickable={false}
      />
    );

    const badge = screen.getByText(/north america/i);
    fireEvent.click(badge);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});


