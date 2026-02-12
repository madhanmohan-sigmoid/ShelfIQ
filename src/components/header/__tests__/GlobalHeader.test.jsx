import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import GlobalHeader from "../GlobalHeader";
import regionRetailerReducer from "../../../redux/reducers/regionRetailerSlice";
import authReducer from "../../../redux/reducers/authSlice";

jest.mock("../components/LogoSection", () =>
  jest.fn(() => <div data-testid="logo-section" />)
);

jest.mock("../components/UserSection", () =>
  jest.fn(() => <div data-testid="user-section" />)
);

jest.mock("../hooks/useHeaderData", () => ({
  useHeaderData: jest.fn(() => ({ user: { name: "Test User" } })),
}));

describe("GlobalHeader", () => {
  const navLabels = [
    "Dashboard",
    "Products",
    "Scorecard",
    "Analysis",
    "My Planogram",
  ];

  let getBoundingClientRectSpy;

  const createMockStore = (categoryAccessType = "CONTRIBUTORS") => {
    return configureStore({
      reducer: {
        auth: authReducer,
        regionRetailer: regionRetailerReducer,
      },
      preloadedState: {
        auth: {
          user: {
            name: "Test User",
            email: "test@example.com",
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: "EMEA",
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          {
                            id: 1,
                            access_type: categoryAccessType,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          token: "test-token",
          isAuthenticated: true,
          loading: false,
          error: null,
        },
        regionRetailer: {
          selectedRegion: "EMEA",
          selectedRetailer: { id: 1, name: "Test Retailer" },
          selectedCategory: { id: 1, name: "Test Category" },
          categoryAccessType: null, // This is computed by the selector
        },
      },
    });
  };

  beforeAll(() => {
    getBoundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        left: 0,
        width: 100,
        top: 0,
        bottom: 0,
        right: 0,
        height: 0,
      });
  });

  afterAll(() => {
    getBoundingClientRectSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders logo, navigation tabs, and user section on non-region routes", () => {
    const store = createMockStore("CONTRIBUTORS");
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <GlobalHeader />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId("logo-section")).toBeInTheDocument();
    expect(screen.getByTestId("user-section")).toBeInTheDocument();

    // Check for navigation labels that should be visible
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Scorecard")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByText("My Planogram")).toBeInTheDocument();
  });

  it("hides navigation when visiting the region route", () => {
    const store = createMockStore("CONTRIBUTORS");
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/region"]}>
          <GlobalHeader />
        </MemoryRouter>
      </Provider>
    );

    navLabels.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });

  it("hides My Planogram tab when categoryAccessType is USERS", () => {
    const store = createMockStore("USERS");
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <GlobalHeader />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.queryByText("My Planogram")).not.toBeInTheDocument();
    // Other tabs should still be visible
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Scorecard")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();
  });

  it("shows My Planogram tab when categoryAccessType is CONTRIBUTORS", () => {
    const store = createMockStore("CONTRIBUTORS");
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <GlobalHeader />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("My Planogram")).toBeInTheDocument();
  });
});


