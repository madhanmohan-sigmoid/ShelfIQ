import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategorySelector from "../CategorySelector";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

const categories = [
  { id: 100, name: "Oral Care", is_active: true },
  { id: 101, name: "Skin Care", is_active: true },
];

const categoriesInactive = [
  { id: 100, name: "Oral Care", is_active: false },
  { id: 101, name: "Skin Care", is_active: false },
];

describe("CategorySelector", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("shows a coming soon message for Walmart", () => {
    render(
      <CategorySelector
        selectedRetailer={{ name: "Walmart" }}
        selectedCategory={null}
        categories={categoriesInactive}
        onCategorySelect={jest.fn()}
      />
    );

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/working hard/i)).toBeInTheDocument();
  });

  it("navigates to the dashboard when selecting an accessible oral category", () => {
    const handleCategorySelect = jest.fn();
    const isCategoryAllowed = jest.fn(() => true);

    render(
      <CategorySelector
        selectedRetailer={{ id: 10, name: "Tesco" }}
        selectedCategory={null}
        categories={categories}
        onCategorySelect={handleCategorySelect}
        selectedRegion="North America"
        isCategoryAllowed={isCategoryAllowed}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Oral Care" }));

    expect(handleCategorySelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 100 })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("disables non-oral categories and shows a coming soon ribbon", () => {
    render(
      <CategorySelector
        selectedRetailer={{ id: 10, name: "Tesco" }}
        selectedCategory={null}
        categories={[
          { id: 200, name: "Oral Care", is_active: true },
          { id: 201, name: "Skin Care", is_active: false },
          { id: 202, name: "Body Care", is_active: false },
        ]}
        onCategorySelect={jest.fn()}
      />
    );

    const skinCareButton = screen.getByRole("button", { name: "Skin Care" });
    expect(skinCareButton).toBeDisabled();
    expect(screen.getAllByText(/Coming Soon/i).length).toBeGreaterThan(0);
  });

  it("highlights the selected oral category", () => {
    render(
      <CategorySelector
        selectedRetailer={{ id: 10, name: "Tesco" }}
        selectedCategory={{ id: 100, name: "Oral Care" }}
        categories={categories}
        onCategorySelect={jest.fn()}
      />
    );

    const oralButton = screen.getByRole("button", { name: "Oral Care" });
    expect(oralButton).toHaveClass("bg-black", "text-white", "border-black");
  });

  it("renders a placeholder when no categories are available", () => {
    render(
      <CategorySelector
        selectedRetailer={{ id: 10, name: "Tesco" }}
        selectedCategory={null}
        categories={[]}
        onCategorySelect={jest.fn()}
      />
    );

    expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
  });
});


