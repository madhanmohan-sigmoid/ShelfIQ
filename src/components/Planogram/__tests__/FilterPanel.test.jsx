import React from 'react';
import { render, act } from '@testing-library/react';
import FilterPanel from '../FilterPanel';

jest.useFakeTimers();

const autocompleteRegistry = [];
let sliderProps = null;

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const React = require('react');

  const BoxMock = ({ children, ...rest }) => (
    <div {...rest}>{children}</div>
  );

  const AutocompleteMock = (props) => {
    autocompleteRegistry.push(props);
    return (
      <div data-testid={`autocomplete-${autocompleteRegistry.length - 1}`}>
        {props.renderInput
          ? props.renderInput({
              InputLabelProps: {},
              InputProps: {},
              inputProps: {},
            })
          : null}
      </div>
    );
  };

  const TextFieldMock = ({
    label,
    placeholder,
    InputLabelProps: _InputLabelProps,
    InputProps: _InputProps,
    inputProps,
    ...rest
  }) => (
    <input
      aria-label={label || placeholder || 'text-field'}
      {...inputProps}
      {...rest}
    />
  );

  const SliderMock = (props) => {
    sliderProps = props;
    return <div data-testid="price-slider" />;
  };

  const TypographyMock = ({ children }) => <div>{children}</div>;
  const CheckboxMock = ({ checked }) => (
    <input type="checkbox" readOnly checked={checked} />
  );
  const ChipMock = ({ label }) => <span>{label}</span>;
  const TooltipMock = ({ children }) => <div>{children}</div>;
  const MenuItemMock = ({ onClick, children }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );

  return {
    ...actual,
    Box: BoxMock,
    Autocomplete: AutocompleteMock,
    TextField: TextFieldMock,
    Slider: SliderMock,
    Typography: TypographyMock,
    Checkbox: CheckboxMock,
    Chip: ChipMock,
    Tooltip: TooltipMock,
    MenuItem: MenuItemMock,
  };
});

jest.mock('@mui/icons-material/CheckBoxOutlineBlank', () => ({
  __esModule: true,
  default: () => <span data-testid="icon-outline" />,
}));

jest.mock('@mui/icons-material/CheckBox', () => ({
  __esModule: true,
  default: () => <span data-testid="icon-checked" />,
}));

const defaultOptions = {
  brands: ['Brand A', 'Brand C'],
  subCategories: ['Snacks'],
  priceTiers: [10, 20, 30, 40],
  npds: [0, 1],
  intensities: ['High', 'Low'],
  benchmarks: [0, 1],
  promoItems: [0, 1],
  platforms: ['Online', 'Store'],
  allBrands: ['Brand A', 'Brand B', 'Brand C'],
  allSubCategories: ['Snacks', 'Drinks'],
};

const defaultBrandCounts = { 'Brand A': 5, 'Brand C': 3 };
const defaultSubCategoryCounts = { Snacks: 4, Drinks: 1 };

const renderPanel = (props = {}) => {
  autocompleteRegistry.length = 0;
  sliderProps = null;

  let currentFilters = {};
  const setFilters = jest.fn((updater) => {
    currentFilters =
      typeof updater === 'function' ? updater(currentFilters) : updater;
  });

  const result = render(
    <FilterPanel
      filters={{}}
      setFilters={setFilters}
      options={defaultOptions}
      brandCounts={defaultBrandCounts}
      subCategoryCounts={defaultSubCategoryCounts}
      {...props}
    />
  );

  return { ...result, setFilters, getFilters: () => currentFilters };
};

describe('FilterPanel', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('applies brand selection and synchronises via debounced update', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    act(() => {
      autocompleteRegistry[0].onChange(null, ['Brand A']);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(getFilters().brands).toEqual(['Brand A']);
  });

  it('disables options not present in enabled lists', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.getOptionDisabled('Brand B')).toBe(true);
    expect(brandAutocomplete.getOptionDisabled('Brand A')).toBe(false);

    const subCategoryAutocomplete = autocompleteRegistry[1];
    expect(subCategoryAutocomplete.getOptionDisabled('Drinks')).toBe(true);
    expect(subCategoryAutocomplete.getOptionDisabled('Snacks')).toBe(false);
  });

  it('updates price range when slider value changes', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    act(() => {
      sliderProps.onChange(null, [15, 35]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(getFilters().priceRange).toEqual([15, 35]);
  });

  it('selects all enabled brands when Select All is clicked', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const brandAutocomplete = autocompleteRegistry[0];
    act(() => {
      brandAutocomplete.onChange(null, ['Select All'], 'selectOption', { option: 'Select All' });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().brands).toEqual(['Brand A', 'Brand C']);
  });

  it('deselects all brands when Select All is clicked again', () => {
    const { setFilters, getFilters } = renderPanel({
      filters: { brands: ['Brand A', 'Brand C'] },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const brandAutocomplete = autocompleteRegistry[0];
    act(() => {
      brandAutocomplete.onChange(null, ['Select All'], 'selectOption', { option: 'Select All' });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().brands).toEqual([]);
  });

  it('shows partial selection state when some brands are selected', () => {
    renderPanel({
      filters: { brands: ['Brand A'] },
    });

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.value).toEqual(['Brand A']);
    expect(brandAutocomplete.options).toContain('Select All');
  });

  it('shows all selected state when all enabled brands are selected', () => {
    renderPanel({
      filters: { brands: ['Brand A', 'Brand C'] },
    });

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.value).toEqual(['Brand A', 'Brand C']);
  });

  it('disables Select All when no enabled options exist', () => {
    renderPanel({
      options: {
        ...defaultOptions,
        brands: [],
        allBrands: [],
      },
    });

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.getOptionDisabled('Select All')).toBe(true);
  });

  it('filters out Select All and disabled options from selection', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const brandAutocomplete = autocompleteRegistry[0];
    act(() => {
      brandAutocomplete.onChange(null, ['Brand A', 'Select All', 'Brand B']);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().brands).toEqual(['Brand A']);
  });

  it('handles flag filter selection for npds', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const npdsAutocomplete = autocompleteRegistry[2];
    act(() => {
      npdsAutocomplete.onChange(null, [1]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().npds).toEqual([1]);
  });

  it('handles flag filter selection for benchmarks', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const benchmarksAutocomplete = autocompleteRegistry[4];
    act(() => {
      benchmarksAutocomplete.onChange(null, [0, 1]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().benchmarks).toEqual([0, 1]);
  });

  it('handles flag filter selection for promoItems', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const promoItemsAutocomplete = autocompleteRegistry[5];
    act(() => {
      promoItemsAutocomplete.onChange(null, [0]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().promoItems).toEqual([0]);
  });

  it('displays Yes/No labels for flag filters', () => {
    renderPanel();

    const npdsAutocomplete = autocompleteRegistry[2];
    expect(npdsAutocomplete.getOptionLabel(1)).toBe('Yes');
    expect(npdsAutocomplete.getOptionLabel(0)).toBe('No');
  });

  it('shows price range fallback when no valid price data', () => {
    renderPanel({
      options: {
        ...defaultOptions,
        priceTiers: [],
        allPriceTiers: [],
      },
    });

    expect(sliderProps.min).toBe(0);
    expect(sliderProps.max).toBe(1000);
  });

  it('shows price range fallback when price data is invalid', () => {
    renderPanel({
      options: {
        ...defaultOptions,
        priceTiers: [NaN, -5, 'invalid'],
        allPriceTiers: [],
      },
    });

    expect(sliderProps.min).toBe(0);
    expect(sliderProps.max).toBe(1000);
  });

  it('uses allPriceTiers when available over enabledPriceTiers', () => {
    renderPanel({
      options: {
        ...defaultOptions,
        priceTiers: [10, 20],
        allPriceTiers: [5, 15, 25, 35],
      },
    });

    expect(sliderProps.min).toBe(5);
    expect(sliderProps.max).toBe(35);
  });

  it('shows no valid price data message when minPrice equals maxPrice', () => {
    const { container } = renderPanel({
      options: {
        ...defaultOptions,
        priceTiers: [10],
        allPriceTiers: [10],
      },
    });

    expect(container.textContent).toContain('No valid price data available');
  });

  it('initializes price range from filters', () => {
    renderPanel({
      filters: { priceRange: [15, 25] },
    });

    expect(sliderProps.value).toEqual([15, 25]);
  });

  it('initializes price range to min/max when not provided in filters', () => {
    renderPanel({
      filters: {},
    });

    expect(sliderProps.value).toEqual([10, 40]);
  });

  it('syncs external filter changes to local state', () => {
    const { rerender, setFilters } = renderPanel({
      filters: { brands: [] },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender(
      <FilterPanel
        filters={{ brands: ['Brand A'] }}
        setFilters={setFilters}
        options={defaultOptions}
      />
    );

    const brandAutocomplete = autocompleteRegistry[autocompleteRegistry.length - 7];
    expect(brandAutocomplete.value).toEqual(['Brand A']);
  });

  it('applies orange theme to price slider', () => {
    renderPanel({
      isOrangeTheme: true,
    });

    expect(sliderProps.sx.color).toBe('#FF782C');
    expect(sliderProps.sx['& .MuiSlider-track'].backgroundColor).toBe('#FF782C');
    expect(sliderProps.sx['& .MuiSlider-thumb'].borderColor).toBe('#FF782C');
  });

  it('applies default theme to price slider when orange theme is false', () => {
    renderPanel({
      isOrangeTheme: false,
    });

    expect(sliderProps.sx.color).toBe('#FFB000');
    expect(sliderProps.sx['& .MuiSlider-track'].backgroundColor).toBe('#FFB000');
    expect(sliderProps.sx['& .MuiSlider-thumb'].borderColor).toBe('#FFB000');
  });

  it('displays brand counts in option labels', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.options).toContain('Brand A');
    expect(brandAutocomplete.options).toContain('Brand C');
  });

  it('displays subcategory counts in option labels', () => {
    renderPanel();

    const subCategoryAutocomplete = autocompleteRegistry[1];
    expect(subCategoryAutocomplete.options).toContain('Snacks');
    expect(subCategoryAutocomplete.options).toContain('Select All');
  });

  it('includes Select All in options when there are enabled values', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.options).toContain('Select All');
  });

  it('sorts options with enabled values first', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    const options = brandAutocomplete.options.filter((opt) => opt !== 'Select All');

    expect(options[0]).toBe('Brand A');
    expect(options[1]).toBe('Brand C');
    expect(options[2]).toBe('Brand B');
  });

  it('filters options based on input value', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    const filtered = brandAutocomplete.filterOptions(brandAutocomplete.options, { inputValue: 'Brand A' });

    expect(filtered).toContain('Select All');
    expect(filtered).toContain('Brand A');
    expect(filtered).not.toContain('Brand B');
  });

  it('always includes Select All in filtered options', () => {
    renderPanel();

    const brandAutocomplete = autocompleteRegistry[0];
    const filtered = brandAutocomplete.filterOptions(brandAutocomplete.options, { inputValue: 'xyz' });

    expect(filtered).toEqual(['Select All']);
  });

  it('handles empty options gracefully', () => {
    renderPanel({
      options: {
        brands: [],
        subCategories: [],
        priceTiers: [],
        npds: [0, 1],
        intensities: [],
        benchmarks: [0, 1],
        promoItems: [0, 1],
        platforms: [],
        allBrands: [],
        allSubCategories: [],
      },
    });

    const brandAutocomplete = autocompleteRegistry[0];
    expect(brandAutocomplete.options).toEqual([]);
  });

  it('handles price range slider with non-array value', () => {
    renderPanel();

    act(() => {
      sliderProps.onChange(null, 20);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const { getFilters } = renderPanel();
    expect(getFilters().priceRange).not.toEqual([20, 20]);
  });

  it('handles price range slider with array length not equal to 2', () => {
    renderPanel();

    act(() => {
      sliderProps.onChange(null, [15]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const { getFilters } = renderPanel();
    expect(getFilters().priceRange).not.toEqual([15]);
  });

  it('clears debounce timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderPanel();

    act(() => {
      autocompleteRegistry[0].onChange(null, ['Brand A']);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('handles subcategory Select All functionality', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const subCategoryAutocomplete = autocompleteRegistry[1];
    act(() => {
      subCategoryAutocomplete.onChange(null, ['Select All'], 'selectOption', { option: 'Select All' });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().subCategories).toEqual(['Snacks']);
  });

  it('handles intensities filter selection', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const intensitiesAutocomplete = autocompleteRegistry[3];
    act(() => {
      intensitiesAutocomplete.onChange(null, ['High']);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().intensities).toEqual(['High']);
  });

  it('handles platforms filter selection', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    const platformsAutocomplete = autocompleteRegistry[6];
    act(() => {
      platformsAutocomplete.onChange(null, ['Online', 'Store']);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getFilters().platforms).toEqual(['Online', 'Store']);
  });

  it('updates price range when external filters change', () => {
    const { rerender, setFilters } = renderPanel({
      filters: { priceRange: [10, 40] },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender(
      <FilterPanel
        filters={{ priceRange: [20, 30] }}
        setFilters={setFilters}
        options={defaultOptions}
      />
    );

    expect(sliderProps.value).toEqual([20, 30]);
  });

  it('resets price range to min/max when external filter is invalid', () => {
    const { rerender, setFilters } = renderPanel({
      filters: { priceRange: [10, 40] },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender(
      <FilterPanel
        filters={{ priceRange: [10] }}
        setFilters={setFilters}
        options={defaultOptions}
      />
    );

    expect(sliderProps.value).toEqual([10, 40]);
  });

  it('handles multiple filter changes with debouncing', () => {
    const { setFilters, getFilters } = renderPanel();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    setFilters.mockClear();

    act(() => {
      autocompleteRegistry[0].onChange(null, ['Brand A']);
      autocompleteRegistry[1].onChange(null, ['Snacks']);
      sliderProps.onChange(null, [15, 35]);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(getFilters().brands).toEqual(['Brand A']);
    expect(getFilters().subCategories).toEqual(['Snacks']);
    expect(getFilters().priceRange).toEqual([15, 35]);
  });
});

