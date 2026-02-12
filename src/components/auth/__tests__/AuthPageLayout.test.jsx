import React from "react";
import { render, screen } from "@testing-library/react";
import AuthPageLayout from "../AuthPageLayout";

describe("AuthPageLayout", () => {
  it("renders children inside the content area", () => {
    render(
      <AuthPageLayout>
        <div data-testid="auth-child">Child Content</div>
      </AuthPageLayout>
    );

    expect(screen.getByTestId("auth-child")).toBeInTheDocument();
    expect(screen.getByTestId("auth-content")).toContainElement(
      screen.getByTestId("auth-child")
    );
  });

  it("shows logo section and divider when showLogo is true by default", () => {
    render(
      <AuthPageLayout>
        <div>Content</div>
      </AuthPageLayout>
    );

    expect(screen.getByTestId("auth-logo-section")).toBeInTheDocument();
    expect(screen.getByAltText("Kenvue Logo")).toBeInTheDocument();
    expect(screen.getByTestId("auth-divider")).toBeInTheDocument();
  });

  it("hides logo section and divider when showLogo is false", () => {
    render(
      <AuthPageLayout showLogo={false}>
        <div>Content</div>
      </AuthPageLayout>
    );

    expect(screen.queryByTestId("auth-logo-section")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Kenvue Logo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-divider")).not.toBeInTheDocument();
  });
});


