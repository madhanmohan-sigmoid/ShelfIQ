import React from "react";
import { render, screen } from "@testing-library/react";
import ClusterGraphicView from "../ClusterGraphicView";
import { useSelector } from "react-redux";
import { selectScorecardData } from "../../../redux/reducers/scorecardSlice";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("../../../redux/reducers/scorecardSlice", () => ({
  selectScorecardData: jest.fn(),
}));

const buildClusterData = (overrides = {}) => ({
  before: {
    sales: {
      "Potential Sales": 100,
      "Potential Sales (Yearly)": 200,
    },
    productivity: {
      "Kenvue shelf share": 0.5,
    },
    assortment: {
      "Total Item count": 10,
    },
  },
  after: {
    sales: {
      "Potential Sales": 125,
      "Potential Sales (Yearly)": 195,
    },
    productivity: {
      "Kenvue shelf share": 0.45,
    },
    assortment: {
      "Total Item count": 10,
    },
  },
  ...overrides,
});

describe("ClusterGraphicView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders each section with formatted lift badges", () => {
    selectScorecardData.mockReturnValue(buildClusterData());
    useSelector.mockImplementation((selector) => selector());

    render(<ClusterGraphicView />);

    expect(screen.getAllByText(/Potential Sales/i).length).toBeGreaterThan(0);
    expect(screen.getByText("+£ 25.00")).toBeInTheDocument();
    expect(screen.getByText("£ -5.00")).toBeInTheDocument();
    expect(screen.getByText("50.00%")).toBeInTheDocument(); // before value formatting
  });

  it("skips metrics whose before and after values are zero", () => {
    selectScorecardData.mockReturnValue(
      buildClusterData({
        before: {
          sales: { "Potential Sales": 0 },
        },
        after: {
          sales: { "Potential Sales": 0 },
        },
      })
    );
    useSelector.mockImplementation((selector) => selector());

    render(<ClusterGraphicView />);

    expect(screen.queryByText("Potential Sales")).not.toBeInTheDocument();
  });

  it("returns null when there is no data", () => {
    selectScorecardData.mockReturnValue(null);
    useSelector.mockImplementation((selector) => selector());

    const { container } = render(<ClusterGraphicView />);
    expect(container.firstChild).toBeNull();
  });
});
