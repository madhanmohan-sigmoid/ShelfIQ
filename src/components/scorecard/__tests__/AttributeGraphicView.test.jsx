import React from "react";
import { render, screen } from "@testing-library/react";
import AttributeGraphicView from "../AttributeGraphicView";
import { useSelector } from "react-redux";
import { selectFilteredScorecardData } from "../../../redux/reducers/scorecardSlice";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("../../../redux/reducers/scorecardSlice", () => ({
  selectFilteredScorecardData: jest.fn(),
}));

const baseMetric = {
  before_sales: 10,
  after_sales: 15,
  before_item_count: 1,
  after_item_count: 2,
  before_facings: 1,
  after_facings: 2,
  before_shelf_space: 10,
  after_shelf_space: 12,
  before_shelf_share: 5,
  after_shelf_share: 6,
  before_sales_share: 5,
  after_sales_share: 6,
};

const buildMetric = (overrides = {}) => ({
  ...baseMetric,
  ...overrides,
});

const mockData = [
  { subcategory: "Hair", brand: "Brand A", ...buildMetric() },
  { subcategory: "Skin", brand: "Brand B", ...buildMetric() },
];

describe("AttributeGraphicView", () => {
  const resizeObserverMock = () => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeAll(() => {
    global.ResizeObserver = jest.fn().mockImplementation(resizeObserverMock);
  });

  afterAll(() => {
    delete global.ResizeObserver;
  });

  const renderComponent = (attributeKey = "brand", dataset = mockData) => {
    selectFilteredScorecardData.mockReturnValue(dataset);
    render(<AttributeGraphicView attributeKey={attributeKey} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockImplementation((selector) => selector());
  });

  it("groups brands under their subcategory and renders lift indicators", () => {
    const dataset = [
      { subcategory: "Hair", brand: "Brand A", ...buildMetric() },
      {
        subcategory: "Hair",
        brand: "Brand B",
        ...buildMetric({
          before_sales: 20,
          after_sales: 10,
        }),
      },
    ];

    renderComponent("brand", dataset);

    expect(screen.getAllByText("HAIR").length).toBeGreaterThan(0);
    expect(screen.queryByText("SKIN")).not.toBeInTheDocument();
    expect(screen.getAllByText("BRAND A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BRAND B").length).toBeGreaterThan(0);
    expect(screen.getByText("+£ 5.00")).toBeInTheDocument();
    expect(screen.getByText("£ -10.00")).toBeInTheDocument();
    expect(screen.getAllByText("Before")[0]).toBeInTheDocument();
    expect(screen.getAllByText("+ve Lift")[0]).toBeInTheDocument();
    expect(screen.getAllByText("-ve Lift")[0]).toBeInTheDocument();
  });

  it("falls back to UNKNOWN when the requested attribute is missing", () => {
    const dataset = [
      { brand: "Brand A", ...buildMetric() },
      {
        brand: "Brand B",
        ...buildMetric({
          before_sales_share: 2,
          after_sales_share: 4,
        }),
      },
    ];

    renderComponent("subcategory", dataset);

    expect(screen.getAllByText("UNKNOWN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("After")[0]).toBeInTheDocument();
    expect(screen.getAllByText("+1.00%").length).toBeGreaterThan(0);
  });

  it("hides zero values while still rendering non-zero metrics", () => {
    const dataset = [
      {
        subcategory: "Hair",
        brand: "Brand A",
        ...buildMetric({
          before_sales: 0,
          after_sales: 0,
          before_facings: 2,
          after_facings: 5,
        }),
      },
    ];

    renderComponent("brand", dataset);

    expect(screen.queryByText("£ 0.00")).not.toBeInTheDocument();
    expect(screen.getByText("+3.00")).toBeInTheDocument();
  });
});
