import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MassUpdateContainer from "../MassUpdateContainer";

const dispatchMock = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: jest.fn(),
}));

jest.mock("../../../redux/reducers/myPlanogramSlice", () => ({
  __esModule: true,
  resetMyPlanogram: jest.fn(() => ({ type: "myPlanogram/reset" })),
}));

jest.mock("../../dashboard/DashboardLayout", () => {
  const DashboardLayoutMock = ({ children }) => (
    <div data-testid="dashboard-layout">{children}</div>
  );
  DashboardLayoutMock.displayName = "DashboardLayoutMock";
  return {
    __esModule: true,
    default: DashboardLayoutMock,
  };
});

jest.mock("../MassUpdateContent", () => {
  const MassUpdateContentMock = () => (
    <div data-testid="mass-update-content">Mass Update Content</div>
  );
  MassUpdateContentMock.displayName = "MassUpdateContentMock";
  return {
    __esModule: true,
    default: MassUpdateContentMock,
  };
});

const { useDispatch } = jest.requireMock("react-redux");
const { resetMyPlanogram } = jest.requireMock(
  "../../../redux/reducers/myPlanogramSlice"
);

describe("MassUpdateContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatchMock);
  });

  it("dispatches resetMyPlanogram on mount", async () => {
    render(<MassUpdateContainer />);

    await waitFor(() => {
      expect(resetMyPlanogram).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledWith({ type: "myPlanogram/reset" });
    });
  });

  it("renders DashboardLayout with MassUpdateContent", () => {
    render(<MassUpdateContainer />);

    const layout = screen.getByTestId("dashboard-layout");
    const content = screen.getByTestId("mass-update-content");

    expect(layout).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(screen.getByText("Mass Update Content")).toBeInTheDocument();
  });
});
