import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ScorecardBar from "../ScorecardBar";
import { useSelector, useDispatch } from "react-redux";
import { selectSelectedTab, setSelectedTab } from "../../../redux/reducers/scorecardSlice";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock("../../../redux/reducers/scorecardSlice", () => ({
  selectSelectedTab: jest.fn(),
  setSelectedTab: jest.fn(),
}));

const mockDispatch = jest.fn();

describe("ScorecardBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
  });

  it("renders tabs and highlights the active one", () => {
    selectSelectedTab.mockReturnValue("cluster");
    useSelector.mockImplementation((selector) => selector());

    render(<ScorecardBar />);

    expect(screen.getByRole("button", { name: /cluster summary/i })).toHaveClass(
      "bg-[#3774B1]"
    );
    expect(screen.getByRole("button", { name: /brand overview/i })).not.toHaveClass(
      "bg-[#3774B1]"
    );
  });

  it("dispatches setSelectedTab when a tab is clicked", () => {
    selectSelectedTab.mockReturnValue("cluster");
    const action = { type: "scorecard/setSelectedTab", payload: "brand" };
    setSelectedTab.mockImplementation((payload) => ({ ...action, payload }));
    useSelector.mockImplementation((selector) => selector());

    render(<ScorecardBar />);

    fireEvent.click(screen.getByRole("button", { name: /brand overview/i }));

    expect(setSelectedTab).toHaveBeenCalledWith("brand");
    expect(mockDispatch).toHaveBeenCalledWith({ ...action, payload: "brand" });
  });
});
