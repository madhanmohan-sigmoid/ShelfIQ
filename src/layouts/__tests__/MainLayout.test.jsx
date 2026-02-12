import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MainLayout from "../MainLayout";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Mock GlobalHeader component
jest.mock("../../components/header", () => ({
  GlobalHeader: jest.fn(() => (
    <div data-testid="global-header">Global Header</div>
  )),
}));

// Mock Outlet from react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: jest.fn(() => <div data-testid="outlet">Outlet Content</div>),
}));

describe("MainLayout", () => {
  const mockTheme = createTheme({
    palette: {
      background: {
        default: "#ffffff",
      },
    },
  });

  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <MemoryRouter>{component}</MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    renderWithTheme(<MainLayout />);
    expect(screen.getByTestId("global-header")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("renders GlobalHeader component", () => {
    renderWithTheme(<MainLayout />);
    const header = screen.getByTestId("global-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("Global Header");
  });

  it("renders Outlet component", () => {
    renderWithTheme(<MainLayout />);
    const outlet = screen.getByTestId("outlet");
    expect(outlet).toBeInTheDocument();
    expect(outlet).toHaveTextContent("Outlet Content");
  });

  it("renders Root container with correct structure", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    
    expect(root).toBeInTheDocument();
    const computedStyle = globalThis.window.getComputedStyle(root);
    expect(computedStyle.display).toBe("flex");
    expect(computedStyle.flexDirection).toBe("column");
    expect(computedStyle.minHeight).toBe("100vh");
  });

  it("renders ContentContainer with correct styles", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    // ContentContainer is the second child (after GlobalHeader)
    const contentContainer = root.children[1];
    
    expect(contentContainer).toBeInTheDocument();
    const computedStyle = globalThis.window.getComputedStyle(contentContainer);
    expect(computedStyle.display).toBe("flex");
    expect(computedStyle.flexGrow).toBe("1");
    expect(computedStyle.height).toBe("calc(100vh - 70px)");
  });

  it("renders MainWrapper with correct structure and theme", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    const contentContainer = root.children[1];
    const mainWrapper = contentContainer.children[0];
    
    expect(mainWrapper).toBeInTheDocument();
    const computedStyle = globalThis.window.getComputedStyle(mainWrapper);
    expect(computedStyle.flexGrow).toBe("1");
    expect(computedStyle.display).toBe("flex");
    expect(computedStyle.flexDirection).toBe("column");
    expect(computedStyle.backgroundColor).toBe("rgb(255, 255, 255)");
  });

  it("has correct component hierarchy: Root > ContentContainer > MainWrapper > Outlet", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    const contentContainer = root.children[1];
    const mainWrapper = contentContainer.children[0];
    const outlet = screen.getByTestId("outlet");
    
    expect(root).toContainElement(contentContainer);
    expect(contentContainer).toContainElement(mainWrapper);
    expect(mainWrapper).toContainElement(outlet);
  });

  it("applies theme background color to MainWrapper", () => {
    const customTheme = createTheme({
      palette: {
        background: {
          default: "#f0f0f0",
        },
      },
    });

    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      </ThemeProvider>
    );

    const root = container.firstChild;
    const contentContainer = root.children[1];
    const mainWrapper = contentContainer.children[0];
    
    const computedStyle = globalThis.window.getComputedStyle(mainWrapper);
    expect(computedStyle.backgroundColor).toBe("rgb(240, 240, 240)");
  });

  it("renders GlobalHeader before ContentContainer", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    
    // GlobalHeader should be the first child
    expect(root.children[0]).toHaveAttribute("data-testid", "global-header");
    // ContentContainer should be the second child
    expect(root.children[1]).toBeInTheDocument();
  });

  it("ContentContainer has correct height calculation for header", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    const contentContainer = root.children[1];
    
    // Height should subtract 70px for header
    const computedStyle = globalThis.window.getComputedStyle(contentContainer);
    expect(computedStyle.height).toBe("calc(100vh - 70px)");
  });

  it("MainWrapper contains Outlet as child", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    const contentContainer = root.children[1];
    const mainWrapper = contentContainer.children[0];
    const outlet = screen.getByTestId("outlet");
    
    expect(mainWrapper).toContainElement(outlet);
    expect(outlet.parentElement).toBe(mainWrapper);
  });

  it("handles theme changes correctly", () => {
    const theme1 = createTheme({
      palette: {
        background: {
          default: "#000000",
        },
      },
    });

    const { container, rerender } = render(
      <ThemeProvider theme={theme1}>
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      </ThemeProvider>
    );

    let root = container.firstChild;
    let contentContainer = root.children[1];
    let mainWrapper = contentContainer.children[0];
    
    let computedStyle = globalThis.window.getComputedStyle(mainWrapper);
    expect(computedStyle.backgroundColor).toBe("rgb(0, 0, 0)");

    const theme2 = createTheme({
      palette: {
        background: {
          default: "#ff0000",
        },
      },
    });

    rerender(
      <ThemeProvider theme={theme2}>
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      </ThemeProvider>
    );

    root = container.firstChild;
    contentContainer = root.children[1];
    mainWrapper = contentContainer.children[0];
    
    computedStyle = window.getComputedStyle(mainWrapper);
    expect(computedStyle.backgroundColor).toBe("rgb(255, 0, 0)");
  });

  it("maintains flex layout structure", () => {
    const { container } = renderWithTheme(<MainLayout />);
    const root = container.firstChild;
    const contentContainer = root.children[1];
    const mainWrapper = contentContainer.children[0];
    
    // Root should be flex column
    const rootStyle = globalThis.window.getComputedStyle(root);
    expect(rootStyle.display).toBe("flex");
    expect(rootStyle.flexDirection).toBe("column");
    
    // ContentContainer should be flex row (default)
    const contentContainerStyle = globalThis.window.getComputedStyle(contentContainer);
    expect(contentContainerStyle.display).toBe("flex");
    
    // MainWrapper should be flex column
    const mainWrapperStyle = globalThis.window.getComputedStyle(mainWrapper);
    expect(mainWrapperStyle.display).toBe("flex");
    expect(mainWrapperStyle.flexDirection).toBe("column");
  });

  it("exports MainLayout as default", () => {
    expect(MainLayout).toBeDefined();
    expect(typeof MainLayout).toBe("function");
  });
});

