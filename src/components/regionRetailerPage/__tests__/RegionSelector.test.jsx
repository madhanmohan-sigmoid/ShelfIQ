import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RegionSelector from "../RegionSelector";

describe("RegionSelector", () => {
  it("renders all region buttons and highlights the selected one", () => {
    render(
      <RegionSelector selectedRegion="EMEA" onRegionSelect={jest.fn()} />
    );

    const regionButtons = screen.getAllByRole("button");
    expect(regionButtons).toHaveLength(4);
    expect(screen.getByRole("button", { name: "EMEA" })).toHaveClass(
      "bg-[#00B097]",
      "text-white",
      "border-[#00B097]"
    );
  });

  it("calls onRegionSelect with the chosen region", () => {
    const handleRegionSelect = jest.fn();
    render(
      <RegionSelector selectedRegion="APAC" onRegionSelect={handleRegionSelect} />
    );

    fireEvent.click(screen.getByRole("button", { name: "LATAM" }));

    expect(handleRegionSelect).toHaveBeenCalledWith("LATAM");
  });
});


