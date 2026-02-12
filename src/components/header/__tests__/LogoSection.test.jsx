import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LogoSection from "../components/LogoSection";

jest.mock("../../../assets/Ace_Logo.png", () => "logo.png");

describe("LogoSection", () => {
  it("renders the ACE logo by default", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <LogoSection />
      </MemoryRouter>
    );

    const logo = screen.getByAltText(/ace logo/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "logo.png");
    expect(
      screen.queryByText(/assortment category excellence/i)
    ).not.toBeInTheDocument();
  });

  it("shows the descriptive text on the region route", () => {
    render(
      <MemoryRouter initialEntries={["/region"]}>
        <LogoSection />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/assortment category excellence/i)
    ).toBeInTheDocument();
  });
});


