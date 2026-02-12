import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserSection from "../components/UserSection";
import { useSelector, useDispatch } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { logout } from "../../../redux/reducers/authSlice";
import { getUserProfileImage, logoutUser } from "../../../api/api";
import ContextSection from "../components/ContextSection";

const mockNavigate = jest.fn();
const logoutRedirectMock = jest.fn();
const dispatchMock = jest.fn();
const logoutActionMock = { type: "auth/logout" };

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

jest.mock("../../../redux/reducers/authSlice", () => ({
  logout: jest.fn(() => ({ type: "auth/logout" })),
}));

jest.mock("../../../api/api", () => ({
  getUserProfileImage: jest.fn(),
  logoutUser: jest.fn(),
}));

jest.mock("../components/ContextSection", () =>
  jest.fn(({ selectedRegion, selectedRetailer, category, clickable }) => (
    <div data-testid="context-section">
      <span>{selectedRegion}</span>
      <span>{selectedRetailer}</span>
      <span>{category}</span>
      <span>{clickable ? "clickable" : "static"}</span>
    </div>
  ))
);

describe("UserSection", () => {
  let getBoundingClientRectSpy;
  let localStorageClearSpy;

  const mockState = {
    auth: {
      user: {
        name: "Doe, John [Non-Kenvue]",
        email: "john.doe@example.com",
      },
      isAuthenticated: true,
    },
    regionRetailer: {
      selectedRegion: "North America",
      selectedRetailer: { name: "Retailer X" },
      selectedCategory: { name: "Hair Care" },
    },
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

  beforeEach(() => {
    jest.clearAllMocks();

    URL.createObjectURL = jest.fn(() => "blob-url");
    localStorageClearSpy = jest.spyOn(Storage.prototype, "clear");

    useDispatch.mockReturnValue(dispatchMock);
    useSelector.mockImplementation((selector) => selector(mockState));

    useMsal.mockReturnValue({
      instance: { logoutRedirect: logoutRedirectMock },
      accounts: [{ username: "john" }],
    });

    mockNavigate.mockClear();
    logoutRedirectMock.mockClear();
    dispatchMock.mockClear();

    getUserProfileImage.mockResolvedValue({ data: new Uint8Array([1, 2, 3]) });
    logoutUser.mockResolvedValue();
    logout.mockReturnValue(logoutActionMock);
  });

  afterEach(() => {
    localStorageClearSpy.mockRestore();
  });

  it("renders the context section and user initials", async () => {
    render(
      <MemoryRouter>
        <UserSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getUserProfileImage).toHaveBeenCalled();
    });

    expect(ContextSection).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedRegion: "North America",
        selectedRetailer: "Retailer X",
        category: "Hair Care",
        clickable: true,
      }),
      {}
    );

    const avatars = screen.getAllByAltText("John Doe");
    expect(avatars[0]).toHaveAttribute("src", "blob-url");
  });

  it("executes the full sign-out flow", async () => {
    render(
      <MemoryRouter>
        <UserSection />
      </MemoryRouter>
    );

    const profileButton = screen.getByRole("button");
    fireEvent.click(profileButton);

    const logoutOption = await screen.findByText(/logout/i);
    fireEvent.click(logoutOption);

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
    });

    expect(logoutRedirectMock).toHaveBeenCalledWith({
      account: { username: "john" },
      postLogoutRedirectUri: "/",
    });
    expect(localStorageClearSpy).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith(logoutActionMock);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});


