import theme from "../theme";

describe("theme", () => {
  it("should export a theme object", () => {
    expect(theme).toBeDefined();
    expect(typeof theme).toBe("object");
  });

  it("should have correct typography font family", () => {
    expect(theme.typography).toBeDefined();
    expect(theme.typography.fontFamily).toContain("Kenvue Sans");
    expect(theme.typography.fontFamily).toContain("Roboto");
    expect(theme.typography.fontFamily).toContain("Helvetica Neue");
    expect(theme.typography.fontFamily).toContain("Arial");
    expect(theme.typography.fontFamily).toContain("sans-serif");
  });

  it("should have primary color set to #cccccc", () => {
    expect(theme.palette).toBeDefined();
    expect(theme.palette.primary).toBeDefined();
    expect(theme.palette.primary.main).toBe("#cccccc");
  });

  it("should have MuiOutlinedInput style overrides", () => {
    expect(theme.components).toBeDefined();
    expect(theme.components.MuiOutlinedInput).toBeDefined();
    expect(theme.components.MuiOutlinedInput.styleOverrides).toBeDefined();
    expect(theme.components.MuiOutlinedInput.styleOverrides.root).toBeDefined();

    const rootStyles = theme.components.MuiOutlinedInput.styleOverrides.root;
    expect(rootStyles["& .MuiOutlinedInput-notchedOutline"].borderColor).toBe("#cccccc");
    expect(rootStyles["&:hover .MuiOutlinedInput-notchedOutline"].borderColor).toBe("#cccccc");
    expect(rootStyles["&.Mui-focused .MuiOutlinedInput-notchedOutline"].borderColor).toBe("#cccccc");
  });

  it("should have MuiCheckbox style overrides", () => {
    expect(theme.components.MuiCheckbox).toBeDefined();
    expect(theme.components.MuiCheckbox.styleOverrides).toBeDefined();
    expect(theme.components.MuiCheckbox.styleOverrides.root).toBeDefined();

    const rootStyles = theme.components.MuiCheckbox.styleOverrides.root;
    expect(rootStyles.color).toBe("#cccccc");
    expect(rootStyles["&.Mui-checked"].color).toBe("#cccccc");
  });

  it("should have MuiAutocomplete style overrides", () => {
    expect(theme.components.MuiAutocomplete).toBeDefined();
    expect(theme.components.MuiAutocomplete.styleOverrides).toBeDefined();
    expect(theme.components.MuiAutocomplete.styleOverrides.popupIndicator).toBeDefined();

    const popupIndicatorStyles = theme.components.MuiAutocomplete.styleOverrides.popupIndicator;
    expect(popupIndicatorStyles.color).toBe("#cccccc");
    expect(popupIndicatorStyles["&:hover"].color).toBe("#cccccc");
  });

  it("should have MuiSlider style overrides with correct colors", () => {
    expect(theme.components.MuiSlider).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides.root).toBeDefined();

    const rootStyles = theme.components.MuiSlider.styleOverrides.root;
    expect(rootStyles.color).toBe("#05AF97");

    expect(theme.components.MuiSlider.styleOverrides.thumb).toBeDefined();
    const thumbStyles = theme.components.MuiSlider.styleOverrides.thumb;
    expect(thumbStyles["&:hover, &.Mui-focusVisible, &.Mui-active"].boxShadow).toBe(
      "0 0 0 8px rgba(5, 175, 151, 0.16)"
    );

    expect(theme.components.MuiSlider.styleOverrides.track).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides.track.backgroundColor).toBe("#05AF97");

    expect(theme.components.MuiSlider.styleOverrides.rail).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides.rail.backgroundColor).toBe("#cceee9");

    expect(theme.components.MuiSlider.styleOverrides.mark).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides.mark.backgroundColor).toBe("#05AF97");

    expect(theme.components.MuiSlider.styleOverrides.markLabel).toBeDefined();
    expect(theme.components.MuiSlider.styleOverrides.markLabel.color).toBe("#333");
  });
});

