import React from "react";
import { render, screen } from "@testing-library/react";
import ClusterSummaryCards from "../ClusterSummaryCards";

const makeSummaryData = (overrides = {}) => ({
  before: {
    sales: {
      "Potential Sales (Yearly)": 1000,
      "Kenvue Potential Sales (Yearly)": 600,
    },
    productivity: {
      "Kenvue shelf share": 0.3,
    },
    assortment: {
      "Total Item count": 10,
      "Total Item count (Kenvue)": 4,
    },
  },
  after: {
    sales: {
      "Potential Sales (Yearly)": 1200,
      "Kenvue Potential Sales (Yearly)": 500,
    },
    productivity: {
      "Kenvue shelf share": 0.3,
    },
    assortment: {
      "Total Item count": 15,
      "Total Item count (Kenvue)": 4,
    },
  },
  ...overrides,
});

describe("ClusterSummaryCards", () => {
  it("renders each metric tile with formatted values and lift badges", () => {
    render(<ClusterSummaryCards data={makeSummaryData()} />);

    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument();
    const contains = (value) => (content) => content.includes(value);
    expect(screen.getAllByText(contains("£1,200")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(contains("£1,000")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(contains("£200")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.0%").length).toBeGreaterThan(0); // zero lift badge from shelf share
  });

  it("applies negative lifts when after values drop below before", () => {
    const data = makeSummaryData({
      after: {
        sales: {
          "Potential Sales (Yearly)": 900,
          "Kenvue Potential Sales (Yearly)": 400,
        },
        productivity: {
          "Kenvue shelf share": 0.1,
        },
        assortment: {
          "Total Item count": 8,
          "Total Item count (Kenvue)": 5,
        },
      },
    });

    render(<ClusterSummaryCards data={data} />);

    expect(screen.getAllByText(/-100/)[0]).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.includes("£-200")).length).toBeGreaterThan(0);
    expect(screen.getByText("-33.3%")).toBeInTheDocument();
  });

  it("returns null when no data is provided", () => {
    const { container } = render(<ClusterSummaryCards data={null} />);
    expect(container.firstChild).toBeNull();
  });
});
