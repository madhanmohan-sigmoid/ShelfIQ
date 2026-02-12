import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { setMasterData } from "../redux/reducers/dataTemplateSlice";
import { setProducts } from "../redux/reducers/productDataSlice";
import { getMasterData, getProductData } from "../api/api";
import { useDispatch } from "react-redux";

jest.mock("../router/AppRouter", () => {
  const AppRouter = () => <div>Mocked App Router</div>;
  AppRouter.displayName = "AppRouter";
  return AppRouter;
});

jest.mock("../api/api", () => ({
  getMasterData: jest.fn(),
  getProductData: jest.fn(),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(),
}));

describe("App", () => {
  const mockDispatch = jest.fn();
  const mockMasterDataPayload = {
    master_products: { data_list: [] },
    master_companies: { data_list: [] },
  };
  const mockProductList = [{ id: 1, product_name: "Sample" }];

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
    getMasterData.mockResolvedValue({ data: { data: mockMasterDataPayload } });
    getProductData.mockResolvedValue({ data: { data: mockProductList } });
  });

  it("fetches data and renders the router once loading completes", async () => {
    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("Mocked App Router")).toBeInTheDocument()
    );

    expect(getMasterData).toHaveBeenCalledTimes(1);
    expect(getProductData).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(setMasterData(mockMasterDataPayload));
    expect(mockDispatch).toHaveBeenCalledWith(setProducts(mockProductList));
  });

  it("handles API errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    getMasterData.mockRejectedValue(new Error("API Error"));

    render(<App />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch master data",
        expect.any(Error)
      );
    });

    // Should still render router even after error
    await waitFor(() =>
      expect(screen.getByText("Mocked App Router")).toBeInTheDocument()
    );

    consoleErrorSpy.mockRestore();
  });

  it("does not render router while loading", () => {
    getMasterData.mockImplementation(() => new Promise(() => {})); // Never resolves
    getProductData.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.queryByText("Mocked App Router")).not.toBeInTheDocument();
  });
});

