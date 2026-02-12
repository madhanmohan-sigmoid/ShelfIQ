import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import KPIComparisonTable from "../KPIComparisonTable";

const tableData = {
  before: {
    sales: {
      "Potential Sales": 100,
      "Lost Sales": 50,
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
      "Potential Sales": 120,
      "Lost Sales": 40,
    },
    productivity: {
      "Kenvue shelf share": 0.6,
    },
    assortment: {
      "Total Item count": 8,
    },
  },
};

describe("KPIComparisonTable", () => {
  it("renders KPI categories and formats metrics", () => {
    render(<KPIComparisonTable data={tableData} />);

    expect(screen.getAllByText(/^Sales$/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Potential Sales/i)).toBeInTheDocument();
    expect(screen.getByText("£120.00")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
  });

  it("supports collapsing and expanding KPI sections", () => {
    render(<KPIComparisonTable data={tableData} />);

    const [salesRow] = screen.getAllByText(/^Sales$/i);
    fireEvent.click(salesRow);
    expect(screen.queryByText(/Potential Sales/i)).not.toBeInTheDocument();

    fireEvent.click(salesRow);
    expect(screen.getByText(/Potential Sales/i)).toBeInTheDocument();
  });

  it("displays lift badges for positive and negative deltas", () => {
    render(<KPIComparisonTable data={tableData} />);

    expect(screen.getAllByText("20.0%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-20.0%").length).toBeGreaterThan(0);
  });

  it("shows fallback when no data is available", () => {
    const empty = { before: {}, after: {} };
    render(<KPIComparisonTable data={empty} />);

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });
});
