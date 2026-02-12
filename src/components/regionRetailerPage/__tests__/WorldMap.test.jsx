const geographyPropsStore = [];
const geographiesFixture = [
  { rsmKey: "FR", properties: { name: "France" } },
  { rsmKey: "CA", properties: { name: "Canada" } },
  { rsmKey: "AT", properties: { name: "Atlantis" } },
];

jest.mock("react-simple-maps", () => ({
  __geographyProps: geographyPropsStore,
  __resetGeographyProps: () => {
    geographyPropsStore.splice(0, geographyPropsStore.length);
  },
  ComposableMap: ({ children }) => <div data-testid="composable-map">{children}</div>,
  Geographies: ({ children }) => children({ geographies: geographiesFixture }),
  Geography: (props) => {
    geographyPropsStore.push(props);
    return (
      <button
        data-testid={`geo-${props.geography.properties.name}`}
        onClick={props.onClick}
      >
        {props.geography.properties.name}
      </button>
    );
  },
}));

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WorldMap from "../WorldMap";
import {
  __geographyProps,
  __resetGeographyProps,
} from "react-simple-maps";

const findGeography = (name) =>
  __geographyProps.find(
    (props) => props.geography.properties.name === name
  );

describe("WorldMap", () => {
  beforeEach(() => {
    __resetGeographyProps();
  });

  it("highlights the selected region and country", () => {
    render(
      <WorldMap
        selectedRegion="EMEA"
        selectedCountry="France"
        selectedRetailer={null}
        onRegionSelect={jest.fn()}
        onCountrySelect={jest.fn()}
      />
    );

    const france = findGeography("France");
    const canada = findGeography("Canada");
    const atlantis = findGeography("Atlantis");

    expect(france.style.default.fill).toBe("#111111");
    expect(canada.style.default.fill).toBe("rgba(255,176,0,0.9)");
    expect(atlantis.style.default.fill).toBe("#F3F3F3");
  });

  it("invokes callbacks when a country is selected", () => {
    const handleRegionSelect = jest.fn();
    const handleCountrySelect = jest.fn();

    render(
      <WorldMap
        selectedRegion={null}
        selectedCountry={null}
        selectedRetailer={null}
        onRegionSelect={handleRegionSelect}
        onCountrySelect={handleCountrySelect}
      />
    );

    fireEvent.click(screen.getByTestId("geo-France"));

    expect(handleRegionSelect).toHaveBeenCalledWith("EMEA");
    expect(handleCountrySelect).toHaveBeenCalledWith("France");
  });

  it("uses retailer highlighting when a retailer is active", () => {
    render(
      <WorldMap
        selectedRegion="EMEA"
        selectedCountry="France"
        selectedRetailer="Tesco"
        onRegionSelect={jest.fn()}
        onCountrySelect={jest.fn()}
      />
    );

    const canada = findGeography("Canada");
    expect(canada.style.default.fill).toBe("rgba(188,213,48,1)");
  });
});


