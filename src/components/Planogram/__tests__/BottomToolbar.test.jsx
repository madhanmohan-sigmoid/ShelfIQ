import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BottomToolbar from '../BottomToolbar';

const autocompleteRegistry = [];
let selectProps = null;

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const React = require('react');

  const BoxMock = ({ component: Component, children, onClick, ...rest }) => {
    if (Component) {
      const Comp = Component;
      return <Comp {...rest} onClick={onClick}>{children}</Comp>;
    }
    return <div {...rest} onClick={onClick}>{children}</div>;
  };

  const TooltipMock = ({ title, children }) => (
    <div data-testid={`tooltip-${typeof title === 'string' ? title : 'tooltip'}`}>
      {children}
    </div>
  );

  const IconButtonMock = ({ onClick, children }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );

  const FormControlMock = ({ children }) => <div>{children}</div>;

  const SelectMock = ({ value, onChange, children }) => {
    selectProps = { value, onChange };
    return (
      <select
        data-testid="tag-map-select"
        value={value}
        onChange={(event) => onChange({ target: { value: event.target.value } })}
      >
        {children}
      </select>
    );
  };

  const MenuItemMock = ({ value, children }) => (
    <option value={value}>{children}</option>
  );

  const AutocompleteMock = (props) => {
    autocompleteRegistry.push(props);
    const mockParams = {
      InputLabelProps: {},
      InputProps: {},
      inputProps: {},
      slotProps: {},
    };
    return (
      <div data-testid={`autocomplete-${autocompleteRegistry.length - 1}`}>
        {props.renderInput ? props.renderInput(mockParams) : null}
        {props.renderOption &&
          props.options?.map((option, index) => {
            const optionProps = { key: index, 'data-option': option };
            return (
              <div key={index} data-testid={`option-${option}`}>
                {props.renderOption(optionProps, option, {
                  value: props.value || [],
                  all: props.options || [],
                  colors: {},
                })}
              </div>
            );
          })}
        {props.renderTags &&
          props.renderTags(props.value || [], () => ({}))}
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

  const ChipMock = ({ label }) => <span>{label}</span>;

  const SwitchMock = ({ checked, onChange, inputProps }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={inputProps?.['aria-label']}
      data-testid="autosave-switch"
    />
  );

  return {
    ...actual,
    Box: BoxMock,
    Tooltip: TooltipMock,
    IconButton: IconButtonMock,
    FormControl: FormControlMock,
    Select: SelectMock,
    MenuItem: MenuItemMock,
    Autocomplete: AutocompleteMock,
    TextField: TextFieldMock,
    Chip: ChipMock,
    Switch: SwitchMock,
  };
});

const dispatchMock = jest.fn();

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('react-redux', () => ({
  __esModule: true,
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/reducers/planogramVisualizerSlice', () => ({
  __esModule: true,
  selectPlanogramProducts: jest.fn(),
  selectTagMapFilters: jest.fn(),
  setTagMapFilters: jest.fn((payload) => ({
    type: 'planogram/setTagMapFilters',
    payload,
  })),
}));

const {
  selectPlanogramProducts: mockSelectPlanogramProducts,
  selectTagMapFilters: mockSelectTagMapFilters,
  setTagMapFilters: mockSetTagMapFilters,
} = jest.requireMock('../../../redux/reducers/planogramVisualizerSlice');

jest.mock('../../../redux/reducers/dataTemplateSlice', () => ({
  __esModule: true,
  selectMasterProductBrands: jest.fn(
    (state) => state.dataTemplate.masterProductBrands
  ),
  selectMasterProductSubCategories: jest.fn(
    (state) => state.dataTemplate.masterProductSubCategories
  ),
}));

jest.mock('../../../redux/reducers/regionRetailerSlice', () => ({
  __esModule: true,
  selectCategoryAccessType: jest.fn((state) => state.regionRetailer.categoryAccessType),
}));

jest.mock('../../../utils/tagMapUtils', () => ({
  __esModule: true,
  generateBrandColors: jest.fn((brands) =>
    Object.fromEntries(brands.map((brand) => [brand, `color-${brand}`]))
  ),
  generateSubCategoryColors: jest.fn((subCategories) =>
    Object.fromEntries(subCategories.map((name) => [name, `color-${name}`]))
  ),
  getUniqueBrandsAndSubCategories: jest.fn((products) => {
    const brandSet = [];
    const subSet = [];
    products.forEach((item) => {
      if (item.brand && !brandSet.includes(item.brand)) {
        brandSet.push(item.brand);
      }
      if (item.subCategory && !subSet.includes(item.subCategory)) {
        subSet.push(item.subCategory);
      }
    });
    return { brands: brandSet, subCategories: subSet };
  }),
}));

const { useDispatch, useSelector } = jest.requireMock('react-redux');

const defaultState = {
  planogramVisualizer: {
    tagMapFilters: {
      selectedType: 'brand',
      selectedBrands: [],
      selectedSubCategories: [],
    },
    planogramProducts: [
      { brand: 'Brand 1', subCategory: 'Sub 1' },
      { brand: 'Brand 2', subCategory: 'Sub 2' },
    ],
  },
  dataTemplate: {
    masterProductBrands: ['Brand 1', 'Brand 2'],
    masterProductSubCategories: ['Sub 1', 'Sub 2'],
  },
  regionRetailer: {
    selectedRegion: null,
    selectedRetailer: null,
    selectedCategory: null,
    selectedCountry: null,
    regionRetailerCategoryMappings: null,
    loading: false,
    error: null,
    categoryAccessType: 'CONTRIBUTORS',
  },
  auth: {
    user: {
      email: 'test@example.com',
      access_groups: {},
    },
  },
};

const renderComponent = (props = {}) =>
  render(
    <BottomToolbar
      onZoomIn={jest.fn()}
      onZoomOut={jest.fn()}
      onReset={jest.fn()}
      onFullscreen={jest.fn()}
      onEdit={jest.fn()}
      setShowProductNameTag={jest.fn()}
      {...props}
    />
  );

describe('BottomToolbar', () => {
  beforeEach(() => {
    autocompleteRegistry.length = 0;
    selectProps = null;
    dispatchMock.mockClear();
    jest.requireMock('react-hot-toast').default.error.mockClear();
    mockSetTagMapFilters.mockClear();
    mockSelectPlanogramProducts.mockImplementation(
      (state) => state.planogramVisualizer.planogramProducts
    );
    mockSelectTagMapFilters.mockImplementation(
      (state) => state.planogramVisualizer.tagMapFilters
    );
    useDispatch.mockReturnValue(dispatchMock);
    useSelector.mockImplementation((selector) => selector(defaultState));
  });

  it('calls zoom handlers and displays normalized zoom percentage', () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    const onReset = jest.fn();

    renderComponent({
      zoomValue: 1.48,
      onZoomIn,
      onZoomOut,
      onReset,
    });

    expect(screen.getByText('148%')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    expect(onZoomOut).toHaveBeenCalled();
    expect(onZoomIn).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
  });

  it('invokes fullscreen and edit callbacks when view toggle is shown', () => {
    const onFullscreen = jest.fn();
    const onEdit = jest.fn();

    renderComponent({
      showViewToggle: true,
      onFullscreen,
      onEdit,
      isFullscreen: false,
    });

    const fullscreenWrapper = screen.getByTestId('tooltip-Fullscreen');
    fireEvent.click(fullscreenWrapper.firstChild);
    expect(onFullscreen).toHaveBeenCalled();

    const editWrapper = screen.getByTestId('tooltip-Edit Planogram');
    fireEvent.click(editWrapper.firstChild);
    expect(onEdit).toHaveBeenCalled();
  });

  it('prevents edit action when planogram is published', () => {
    const onEdit = jest.fn();

    renderComponent({
      showViewToggle: true,
      planogramStatus: 'published',
      onEdit,
    });

    const editTooltip = screen.getByTestId(
      'tooltip-This planogram is published and cannot be edited. To make changes, please clone the planogram from the "My Planogram" section first.'
    );

    fireEvent.click(editTooltip.firstChild);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('dispatches tag map filter updates for brand selections', () => {
    renderComponent({
      showProductNameTag: false,
    });

    const activeAutocompletes = autocompleteRegistry.filter(Boolean);
    expect(activeAutocompletes).toHaveLength(1);

    act(() => {
      activeAutocompletes[0].onChange(null, ['Brand 2']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedBrands: ['Brand 2'],
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedBrands: ['Brand 2'] },
    });
  });

  it('toggles back to labels view when Labels pill is clicked', () => {
    const setShowProductNameTag = jest.fn();

    renderComponent({
      showProductNameTag: false,
      setShowProductNameTag,
    });

    fireEvent.click(screen.getByText('Labels'));
    expect(setShowProductNameTag).toHaveBeenCalledWith(true);
  });

  it('changes tag map type through select input', () => {
    renderComponent({
      showProductNameTag: false,
    });

    expect(selectProps).not.toBeNull();

    act(() => {
      selectProps.onChange({ target: { value: 'subcategory' } });
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedType: 'subcategory',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedType: 'subcategory' },
    });
  });

  describe('Zoom Percentage Normalization', () => {
    it('normalizes zoom value close to 1 to 100%', () => {
      renderComponent({ zoomValue: 1.03 });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('normalizes zoom value slightly below 1 to 100%', () => {
      renderComponent({ zoomValue: 0.97 });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('displays correct percentage for values not close to 1', () => {
      renderComponent({ zoomValue: 0.5 });
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('handles non-number zoom value by defaulting to 1', () => {
      renderComponent({ zoomValue: null });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles undefined zoom value', () => {
      renderComponent({ zoomValue: undefined });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles zero zoom value', () => {
      renderComponent({ zoomValue: 0 });
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles very large zoom values', () => {
      renderComponent({ zoomValue: 5.5 });
      expect(screen.getByText('550%')).toBeInTheDocument();
    });
  });

  describe('Select All Functionality', () => {
    it('selects all brands when Select All is clicked', () => {
      const stateWithMoreBrands = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          planogramProducts: [
            { brand: 'Brand 1', subCategory: 'Sub 1' },
            { brand: 'Brand 2', subCategory: 'Sub 2' },
            { brand: 'Brand 3', subCategory: 'Sub 3' },
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithMoreBrands));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes).toHaveLength(1);

      act(() => {
        activeAutocompletes[0].onChange(null, ['Select All']);
      });

      expect(mockSetTagMapFilters).toHaveBeenCalledWith({
        selectedBrands: ['Brand 1', 'Brand 2', 'Brand 3'],
      });
    });

    it('deselects all brands when Deselect All is clicked', () => {
      const stateWithAllSelected = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: ['Brand 1', 'Brand 2', 'Brand 3'],
            selectedSubCategories: [],
          },
          planogramProducts: [
            { brand: 'Brand 1', subCategory: 'Sub 1' },
            { brand: 'Brand 2', subCategory: 'Sub 2' },
            { brand: 'Brand 3', subCategory: 'Sub 3' },
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithAllSelected));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      act(() => {
        activeAutocompletes[0].onChange(null, ['Select All']);
      });

      expect(mockSetTagMapFilters).toHaveBeenCalledWith({
        selectedBrands: [],
      });
    });

    it('selects all subcategories when Select All is clicked', () => {
      const stateWithSubcategories = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: [],
          },
          planogramProducts: [
            { brand: 'Brand 1', subCategory: 'Sub 1' },
            { brand: 'Brand 2', subCategory: 'Sub 2' },
            { brand: 'Brand 3', subCategory: 'Sub 3' },
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithSubcategories));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      act(() => {
        activeAutocompletes[0].onChange(null, ['Select All']);
      });

      expect(mockSetTagMapFilters).toHaveBeenCalledWith({
        selectedSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
      });
    });

    it('does not show Select All when there are 2 or fewer options', () => {
      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].options).not.toContain('Select All');
      expect(activeAutocompletes[0].options).toEqual(['Brand 1', 'Brand 2']);
    });
  });

  describe('Subcategory Selections', () => {
    it('dispatches tag map filter updates for subcategory selections', () => {
      const stateWithSubcategories = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: [],
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithSubcategories));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes).toHaveLength(1);

      act(() => {
        activeAutocompletes[0].onChange(null, ['Sub 2']);
      });

      expect(mockSetTagMapFilters).toHaveBeenCalledWith({
        selectedSubCategories: ['Sub 2'],
      });
    });
  });

  describe('Tag Map Toggle', () => {
    it('switches to Tag Map view when Tag Map pill is clicked', () => {
      const setShowProductNameTag = jest.fn();

      renderComponent({
        showProductNameTag: true,
        setShowProductNameTag,
      });

      fireEvent.click(screen.getByText('Tag Map'));
      expect(setShowProductNameTag).toHaveBeenCalledWith(false);
    });

    it('changes type to brand when switching to Tag Map if current type is not brand', () => {
      const setShowProductNameTag = jest.fn();
      const stateWithSubcategoryType = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: [],
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithSubcategoryType));

      renderComponent({
        showProductNameTag: true,
        setShowProductNameTag,
      });

      fireEvent.click(screen.getByText('Tag Map'));

      expect(setShowProductNameTag).toHaveBeenCalledWith(false);
      expect(mockSetTagMapFilters).toHaveBeenCalledWith({
        selectedType: 'brand',
      });
    });

    it('does not change type when switching to Tag Map if current type is already brand', () => {
      const setShowProductNameTag = jest.fn();

      renderComponent({
        showProductNameTag: true,
        setShowProductNameTag,
      });

      fireEvent.click(screen.getByText('Tag Map'));

      expect(setShowProductNameTag).toHaveBeenCalledWith(false);
      // Should not dispatch type change since it's already brand
      const typeChangeCalls = dispatchMock.mock.calls.filter(
        (call) => call[0].payload?.selectedType === 'brand'
      );
      expect(typeChangeCalls.length).toBe(0);
    });
  });

  describe('Theme Colors', () => {
    it('uses orange theme colors when isOrangeTheme is true', () => {
      renderComponent({ isOrangeTheme: true });
      // Component renders with orange theme - verify it doesn't crash
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('uses default yellow theme colors when isOrangeTheme is false', () => {
      renderComponent({ isOrangeTheme: false });
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });
  });

  describe('View Toggle Section', () => {
    it('shows ViewToggleSection when showViewToggle is true', () => {
      renderComponent({ showViewToggle: true });
      expect(screen.getByTestId('tooltip-Fullscreen')).toBeInTheDocument();
    });

    it('shows ViewToggleSection when isOrangeTheme is true even if showViewToggle is undefined', () => {
      renderComponent({ isOrangeTheme: true, showViewToggle: undefined });
      expect(screen.getByTestId('tooltip-Fullscreen')).toBeInTheDocument();
    });

    it('hides ViewToggleSection when showViewToggle is false and isOrangeTheme is false', () => {
      renderComponent({ showViewToggle: false, isOrangeTheme: false });
      expect(screen.queryByTestId('tooltip-Fullscreen')).not.toBeInTheDocument();
    });

    it('shows fullscreen as active when isFullscreen is true', () => {
      renderComponent({
        showViewToggle: true,
        isFullscreen: true,
      });
      expect(screen.getByTestId('tooltip-Fullscreen')).toBeInTheDocument();
    });

    it('handles edit when onEdit is not provided', () => {
      renderComponent({
        showViewToggle: true,
        onEdit: undefined,
        planogramStatus: 'draft',
      });

      const editWrapper = screen.getByTestId('tooltip-Edit Planogram');
      fireEvent.click(editWrapper.firstChild);
      // Should not crash
      expect(editWrapper).toBeInTheDocument();
    });

    it('handles fullscreen when onFullscreen is not provided', () => {
      renderComponent({
        showViewToggle: true,
        onFullscreen: undefined,
      });

      const fullscreenWrapper = screen.getByTestId('tooltip-Fullscreen');
      fireEvent.click(fullscreenWrapper.firstChild);
      // Should not crash
      expect(fullscreenWrapper).toBeInTheDocument();
    });
  });

  describe('Render Functions', () => {
    it('renders tag map input with correct label for brands', () => {
      renderComponent({ showProductNameTag: false });

      const input = screen.getByLabelText('Select Brand');
      expect(input).toBeInTheDocument();
    });

    it('renders tag map input with correct label for subcategories', () => {
      const stateWithSubcategories = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: [],
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithSubcategories));

      renderComponent({ showProductNameTag: false });

      const input = screen.getByLabelText('Select Subcategory');
      expect(input).toBeInTheDocument();
    });

    it('renders tag count chip when items are selected', () => {
      const stateWithSelected = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: ['Brand 1', 'Brand 2'],
            selectedSubCategories: [],
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithSelected));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      const tags = activeAutocompletes[0].renderTags(['Brand 1', 'Brand 2'], () => ({}));
      expect(tags).toBeDefined();
      expect(tags[0]).toBeTruthy();
    });

    it('does not render tag count chip when no items are selected', () => {
      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      const tags = activeAutocompletes[0].renderTags([], () => ({}));
      expect(tags[0]).toBeFalsy();
    });

    it('renders Select All option correctly', () => {
      const stateWithMoreBrands = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          planogramProducts: [
            { brand: 'Brand 1', subCategory: 'Sub 1' },
            { brand: 'Brand 2', subCategory: 'Sub 2' },
            { brand: 'Brand 3', subCategory: 'Sub 3' },
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithMoreBrands));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      const options = activeAutocompletes[0].options;
      expect(options).toContain('Select All');
    });

    it('renders Deselect All when all items are selected', () => {
      const stateWithAllSelected = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: ['Brand 1', 'Brand 2'],
            selectedSubCategories: [],
          },
          planogramProducts: [
            { brand: 'Brand 1', subCategory: 'Sub 1' },
            { brand: 'Brand 2', subCategory: 'Sub 2' },
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithAllSelected));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      const optionsData = {
        value: ['Brand 1', 'Brand 2'],
        all: ['Brand 1', 'Brand 2'],
        colors: { 'Brand 1': 'color-Brand 1', 'Brand 2': 'color-Brand 2' },
      };
      const selectAllOption = activeAutocompletes[0].renderOption(
        {},
        'Select All',
        optionsData
      );
      expect(selectAllOption.props.children).toBe('Deselect All');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty planogram products', () => {
      const stateWithNoProducts = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          planogramProducts: [],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithNoProducts));

      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].options).toEqual([]);
    });

    it('handles null planogram products', () => {
      const stateWithNullProducts = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          planogramProducts: null,
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithNullProducts));

      renderComponent({ showProductNameTag: false });
      // Should not crash
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('handles products without brand or subcategory', () => {
      const stateWithIncompleteProducts = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          planogramProducts: [
            { brand: 'Brand 1' },
            { subCategory: 'Sub 1' },
            {},
          ],
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithIncompleteProducts));

      renderComponent({ showProductNameTag: false });
      // Should not crash
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('handles missing tagMapFilters', () => {
      const stateWithNoFilters = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: null,
        },
      };
      mockSelectTagMapFilters.mockImplementation(() => null);
      useSelector.mockImplementation((selector) => {
        if (selector === mockSelectTagMapFilters) return null;
        return selector(stateWithNoFilters);
      });

      renderComponent({ showProductNameTag: false });
      // Should default to brand type
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('handles undefined selectedBrands', () => {
      const stateWithUndefinedBrands = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: undefined,
            selectedSubCategories: [],
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUndefinedBrands));

      renderComponent({ showProductNameTag: false });
      // Should default to empty array
      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].value).toEqual([]);
    });

    it('handles undefined selectedSubCategories', () => {
      const stateWithUndefinedSubCategories = {
        ...defaultState,
        planogramVisualizer: {
          ...defaultState.planogramVisualizer,
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: undefined,
          },
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUndefinedSubCategories));

      renderComponent({ showProductNameTag: false });
      // Should default to empty array
      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].value).toEqual([]);
    });
  });

  describe('Default Props', () => {
    it('uses default zoomValue of 1 when not provided', () => {
      renderComponent({ zoomValue: undefined });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('uses default showProductNameTag of true when not provided', () => {
      renderComponent({ showProductNameTag: undefined });
      expect(screen.getByText('Labels')).toBeInTheDocument();
      // Tag Map selectors should not be visible
      expect(autocompleteRegistry.length).toBe(0);
    });

    it('uses default isFullscreen of false when not provided', () => {
      renderComponent({ showViewToggle: true, isFullscreen: undefined });
      expect(screen.getByTestId('tooltip-Fullscreen')).toBeInTheDocument();
    });

    it('uses default isOrangeTheme of false when not provided', () => {
      renderComponent({ isOrangeTheme: undefined });
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('hides TagMapSelectors when showProductNameTag is true', () => {
      renderComponent({ showProductNameTag: true });
      expect(autocompleteRegistry.length).toBe(0);
    });

    it('shows TagMapSelectors when showProductNameTag is false', () => {
      renderComponent({ showProductNameTag: false });
      expect(autocompleteRegistry.length).toBeGreaterThan(0);
    });

    it('passes correct optionsData to TagMapSelectors', () => {
      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].options).toContain('Brand 1');
      expect(activeAutocompletes[0].options).toContain('Brand 2');
      expect(activeAutocompletes[0].value).toEqual([]);
    });

    it('uses getOptionLabel to convert options to strings', () => {
      renderComponent({ showProductNameTag: false });

      const activeAutocompletes = autocompleteRegistry.filter(Boolean);
      expect(activeAutocompletes[0].getOptionLabel).toBeDefined();
      expect(typeof activeAutocompletes[0].getOptionLabel).toBe('function');
      expect(activeAutocompletes[0].getOptionLabel('Brand 1')).toBe('Brand 1');
      expect(activeAutocompletes[0].getOptionLabel(123)).toBe('123');
    });
  });

  describe('Undo Section', () => {
    it('calls onUndo when canUndo is true and undo is clicked', () => {
      const onUndo = jest.fn();

      renderComponent({
        canUndo: true,
        onUndo,
      });

      const undoTooltip = screen.getByTestId('tooltip-Undo last change');
      expect(undoTooltip).toBeInTheDocument();
      fireEvent.click(undoTooltip.firstChild);
      expect(onUndo).toHaveBeenCalled();
    });

    it('does not call onUndo when canUndo is false', () => {
      const onUndo = jest.fn();

      renderComponent({
        canUndo: false,
        onUndo,
      });

      const undoTooltip = screen.getByTestId('tooltip-Nothing to undo');
      expect(undoTooltip).toBeInTheDocument();
      fireEvent.click(undoTooltip.firstChild);
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('shows correct tooltip when canUndo is true', () => {
      renderComponent({ canUndo: true });
      expect(screen.getByTestId('tooltip-Undo last change')).toBeInTheDocument();
    });

    it('shows correct tooltip when canUndo is false', () => {
      renderComponent({ canUndo: false });
      expect(screen.getByTestId('tooltip-Nothing to undo')).toBeInTheDocument();
    });

    it('handles undefined onUndo gracefully', () => {
      renderComponent({
        canUndo: true,
        onUndo: undefined,
      });

      const undoTooltip = screen.getByTestId('tooltip-Undo last change');
      fireEvent.click(undoTooltip.firstChild);
      // Should not crash
      expect(undoTooltip).toBeInTheDocument();
    });
  });

  describe('Activities Section', () => {
    it('shows Activities section when conditions are met', () => {
      const onToggleActivities = jest.fn();

      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
        onToggleActivities,
      });

      const activitiesTooltip = screen.getByTestId('tooltip-View recent activity');
      expect(activitiesTooltip).toBeInTheDocument();
      fireEvent.click(activitiesTooltip.firstChild);
      expect(onToggleActivities).toHaveBeenCalled();
    });

    it('hides Activities section when isOrangeTheme is false', () => {
      renderComponent({
        isOrangeTheme: false,
        isFullscreen: false,
        planogramStatus: 'draft',
      });

      expect(screen.queryByTestId('tooltip-View recent activity')).not.toBeInTheDocument();
    });

    it('hides Activities section when isFullscreen is true', () => {
      renderComponent({
        isOrangeTheme: true,
        isFullscreen: true,
        planogramStatus: 'draft',
      });

      expect(screen.queryByTestId('tooltip-View recent activity')).not.toBeInTheDocument();
    });

    it('hides Activities section when planogram is published', () => {
      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'published',
      });

      expect(screen.queryByTestId('tooltip-View recent activity')).not.toBeInTheDocument();
    });

    it('hides Activities section when categoryAccessType is USERS', () => {
      const stateWithUsersAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'USERS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUsersAccess));

      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
      });

      expect(screen.queryByTestId('tooltip-View recent activity')).not.toBeInTheDocument();
    });

    it('calls onToggleActivities when Activities section is clicked', () => {
      const onToggleActivities = jest.fn();

      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
        onToggleActivities,
      });

      const activitiesTooltip = screen.getByTestId('tooltip-View recent activity');
      fireEvent.click(activitiesTooltip.firstChild);
      expect(onToggleActivities).toHaveBeenCalled();
    });
  });

  describe('Checks Section', () => {
    it('shows Checks section when activity conditions and onToggleChecks are met', () => {
      const onToggleChecks = jest.fn();

      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
        onToggleChecks,
      });

      const checksTooltip = screen.getByTestId('tooltip-View violation checks');
      expect(checksTooltip).toBeInTheDocument();
    });

    it('shows Checks section when in fullscreen with onToggleChecks', () => {
      const onToggleChecks = jest.fn();

      renderComponent({
        isOrangeTheme: false,
        isFullscreen: true,
        planogramStatus: 'draft',
        onToggleChecks,
      });

      const checksTooltip = screen.getByTestId('tooltip-View violation checks');
      expect(checksTooltip).toBeInTheDocument();
    });

    it('calls onToggleChecks when Checks section is clicked', () => {
      const onToggleChecks = jest.fn();

      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
        onToggleChecks,
      });

      const checksTooltip = screen.getByTestId('tooltip-View violation checks');
      fireEvent.click(checksTooltip.firstChild);
      expect(onToggleChecks).toHaveBeenCalled();
    });

    it('does not render Checks section when onToggleChecks is not provided', () => {
      renderComponent({
        isOrangeTheme: true,
        isFullscreen: false,
        planogramStatus: 'draft',
        onToggleChecks: undefined,
      });

      expect(screen.queryByTestId('tooltip-View violation checks')).not.toBeInTheDocument();
    });
  });

  describe('Autosave Toggle', () => {
    it('shows autosave toggle when not in fullscreen and not published', () => {
      renderComponent({
        isFullscreen: false,
        planogramStatus: 'draft',
        autoSaveEnabled: false,
        onToggleAutoSave: jest.fn(),
      });

      const switchElement = screen.getByTestId('autosave-switch');
      expect(switchElement).toBeInTheDocument();
      expect(screen.getByText('Autosave')).toBeInTheDocument();
    });

    it('hides autosave toggle when in fullscreen', () => {
      renderComponent({
        isFullscreen: true,
        planogramStatus: 'draft',
        autoSaveEnabled: false,
        onToggleAutoSave: jest.fn(),
      });

      expect(screen.queryByTestId('autosave-switch')).not.toBeInTheDocument();
    });

    it('hides autosave toggle when planogram is published', () => {
      renderComponent({
        isFullscreen: false,
        planogramStatus: 'published',
        autoSaveEnabled: false,
        onToggleAutoSave: jest.fn(),
      });

      expect(screen.queryByTestId('autosave-switch')).not.toBeInTheDocument();
    });

    it('calls onToggleAutoSave when switch is toggled', () => {
      const onToggleAutoSave = jest.fn();

      renderComponent({
        isFullscreen: false,
        planogramStatus: 'draft',
        autoSaveEnabled: false,
        onToggleAutoSave,
      });

      const switchElement = screen.getByTestId('autosave-switch');
      fireEvent.click(switchElement);
      expect(onToggleAutoSave).toHaveBeenCalled();
    });

    it('reflects autoSaveEnabled state in switch', () => {
      const { rerender } = renderComponent({
        isFullscreen: false,
        planogramStatus: 'draft',
        autoSaveEnabled: false,
        onToggleAutoSave: jest.fn(),
      });

      let switchElement = screen.getByTestId('autosave-switch');
      expect(switchElement.checked).toBe(false);

      rerender(
        <BottomToolbar
          onZoomIn={jest.fn()}
          onZoomOut={jest.fn()}
          onReset={jest.fn()}
          onFullscreen={jest.fn()}
          onEdit={jest.fn()}
          setShowProductNameTag={jest.fn()}
          isFullscreen={false}
          planogramStatus="draft"
          autoSaveEnabled={true}
          onToggleAutoSave={jest.fn()}
        />
      );

      switchElement = screen.getByTestId('autosave-switch');
      expect(switchElement.checked).toBe(true);
    });
  });

  describe('Edit Disabled by Access', () => {
    it('shows access restriction tooltip when categoryAccessType is USERS', () => {
      const stateWithUsersAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'USERS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUsersAccess));

      renderComponent({
        showViewToggle: true,
        planogramStatus: 'draft',
      });

      const editTooltip = screen.getByTestId(
        'tooltip-You do not have permission to edit planograms for this category. Only contributors can edit planograms.'
      );
      expect(editTooltip).toBeInTheDocument();
    });

    it('shows toast error when edit is clicked with USERS access', () => {
      const stateWithUsersAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'USERS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUsersAccess));

      const onEdit = jest.fn();
      const mockToastError = jest.requireMock('react-hot-toast').default.error;

      renderComponent({
        showViewToggle: true,
        planogramStatus: 'draft',
        onEdit,
      });

      const editTooltip = screen.getByTestId(
        'tooltip-You do not have permission to edit planograms for this category. Only contributors can edit planograms.'
      );
      
      // The tooltip wraps the Box element which has onClick handler
      // Click on the first child (the Box div) - same pattern as other tests
      const editButton = editTooltip.firstChild;
      
      // Use the same pattern as the working test (line 300-302)
      // The onClick handler should be attached via React's synthetic events
      fireEvent.click(editButton);

      // The onClick handler should call toast.error when isEditDisabledByAccess is true
      // Verify the toast was called
      expect(mockToastError).toHaveBeenCalledWith(
        'You do not have permission to edit planograms for this category. Only contributors can edit planograms.'
      );
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('disables edit when categoryAccessType is USERS even if planogram is draft', () => {
      const stateWithUsersAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'USERS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUsersAccess));

      const onEdit = jest.fn();

      renderComponent({
        showViewToggle: true,
        planogramStatus: 'draft',
        onEdit,
      });

      const editTooltip = screen.getByTestId(
        'tooltip-You do not have permission to edit planograms for this category. Only contributors can edit planograms.'
      );
      fireEvent.click(editTooltip.firstChild);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('allows edit when categoryAccessType is CONTRIBUTORS', () => {
      const stateWithContributorsAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'CONTRIBUTORS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithContributorsAccess));

      const onEdit = jest.fn();

      renderComponent({
        showViewToggle: true,
        planogramStatus: 'draft',
        onEdit,
      });

      const editTooltip = screen.getByTestId('tooltip-Edit Planogram');
      fireEvent.click(editTooltip.firstChild);
      expect(onEdit).toHaveBeenCalled();
      const mockToastError = jest.requireMock('react-hot-toast').default.error;
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('prioritizes access restriction over published status for tooltip', () => {
      const stateWithUsersAccess = {
        ...defaultState,
        regionRetailer: {
          ...defaultState.regionRetailer,
          categoryAccessType: 'USERS',
        },
      };
      useSelector.mockImplementation((selector) => selector(stateWithUsersAccess));

      renderComponent({
        showViewToggle: true,
        planogramStatus: 'published',
      });

      // Should show access restriction tooltip, not published tooltip
      expect(screen.getByTestId(
        'tooltip-You do not have permission to edit planograms for this category. Only contributors can edit planograms.'
      )).toBeInTheDocument();
    });
  });
});