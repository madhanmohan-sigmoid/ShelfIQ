import React from "react";
import { render, screen } from "@testing-library/react";
import ComparisonChart from "../ComparisonChart";

const chartData = {
  before: {
    avg_sales: 50,
    avg_unique_item_count: 2,
    avg_facing_count: 3,
    avg_shelf_space: 40,
    avg_shelf_share: 10,
    avg_sales_share: 20,
  },
  after: {
    avg_sales: 30,
    avg_unique_item_count: 6,
    avg_facing_count: 1,
    avg_shelf_space: 55,
    avg_shelf_share: 15,
    avg_sales_share: 10,
  },
};

describe("ComparisonChart", () => {
  it("renders before, after and lift columns with formatted numbers", () => {
    render(<ComparisonChart data={chartData} />);

    expect(screen.getByRole("heading", { name: /before/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /after/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lift/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Sales Amount/i).length).toBeGreaterThan(0);
    expect(screen.getByText("15.00%")).toBeInTheDocument();
    expect(screen.getByText(/-20/)).toBeInTheDocument();
  });

  it("shows empty message when data is missing", () => {
    render(<ComparisonChart data={null} />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });
});
