import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContextSection from "../components/ContextSection";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../../assets/Globe Surface.svg", () => "globe.svg");
jest.mock("../../../assets/Building Shop.svg", () => "building.svg");
jest.mock("../../../assets/Extended Dock.svg", () => "dock.svg");

describe("ContextSection", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it("returns null when no context values are available", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ContextSection />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("hides itself on the region route", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/region"]}>
        <ContextSection selectedRegion="North America" />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the three context pills and persists values to localStorage", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ContextSection
          selectedRegion="North America"
          selectedRetailer="Retailer X"
          category="Hair Care"
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/north america/i)).toBeInTheDocument();
    expect(screen.getByText(/retailer x/i)).toBeInTheDocument();
    expect(screen.getByText(/hair care/i)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("contextValues"));
    expect(stored).toEqual({
      region: "North America",
      retailer: "Retailer X",
      category: "Hair Care",
    });
  });

  it("navigates to the region page when a pill is activated", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ContextSection
          selectedRegion="North America"
          selectedRetailer="Retailer X"
          category="Hair Care"
        />
      </MemoryRouter>
    );

    const regionButton = screen.getByRole("button", { name: /north america/i });
    fireEvent.click(regionButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/region?selected=North%20America"
    );
  });
});


