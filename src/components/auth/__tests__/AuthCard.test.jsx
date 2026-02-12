import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthCard from "../AuthCard";

const baseProps = {
  title: "Welcome Back",
  description: "Sign in to continue.",
  buttonText: "Continue",
  onButtonClick: jest.fn(),
};

describe("AuthCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a loading indicator when loading is true", () => {
    render(<AuthCard {...baseProps} loading />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
  });

  it("displays provided title, subtitle, description, and button text", () => {
    render(
      <AuthCard
        {...baseProps}
        subtitle="Please authenticate"
        error="Something went wrong"
      />
    );

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByText("Please authenticate")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue.")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("calls onButtonClick when the button is pressed and not disabled", async () => {
    const user = userEvent.setup();

    render(<AuthCard {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(baseProps.onButtonClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onButtonClick when the button is disabled", async () => {
    render(<AuthCard {...baseProps} disabled />);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(baseProps.onButtonClick).not.toHaveBeenCalled();
  });
});


