import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ZoomControls from '../ZoomControls';

const autocompleteRegistry = [];
let selectProps = null;

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const React = require('react');

  const BoxMock = ({ component: Component, children, ...rest }) => {
    if (Component) {
      const Comp = Component;
      return <Comp {...rest}>{children}</Comp>;
    }
    return (
      <div {...rest}>{children}</div>
    );
  };

  const PaperMock = ({ children, ...rest }) => (
    <div {...rest}>{children}</div>
  );

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
        data-testid="tag-type-select"
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

  const ChipMock = ({ label }) => <span>{label}</span>;

  return {
    ...actual,
    Box: BoxMock,
    Paper: PaperMock,
    Tooltip: TooltipMock,
    IconButton: IconButtonMock,
    FormControl: FormControlMock,
    Select: SelectMock,
    MenuItem: MenuItemMock,
    Autocomplete: AutocompleteMock,
    TextField: TextFieldMock,
    Chip: ChipMock,
  };
});

const dispatchMock = jest.fn();

jest.mock('react-redux', () => ({
  __esModule: true,
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/reducers/planogramVisualizerSlice', () => ({
  __esModule: true,
  selectTagMapFilters: jest.fn(),
  selectPlanogramProducts: jest.fn(),
  setTagMapFilters: jest.fn((payload) => ({
    type: 'planogram/setTagMapFilters',
    payload,
  })),
}));

const {
  selectTagMapFilters: mockSelectTagMapFilters,
  selectPlanogramProducts: mockSelectPlanogramProducts,
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
};

const renderComponent = (props = {}) =>
  render(
    <ZoomControls
      onZoomIn={jest.fn()}
      onZoomOut={jest.fn()}
      onFullscreen={jest.fn()}
      onReset={jest.fn()}
      setShowProductNameTag={jest.fn()}
      {...props}
    />
  );

describe('ZoomControls', () => {
  beforeEach(() => {
    autocompleteRegistry.length = 0;
    selectProps = null;
    dispatchMock.mockClear();
    mockSetTagMapFilters.mockClear();
    mockSelectTagMapFilters.mockImplementation(
      (state) => state.planogramVisualizer.tagMapFilters
    );
    mockSelectPlanogramProducts.mockImplementation(
      (state) => state.planogramVisualizer.planogramProducts
    );
    useDispatch.mockReturnValue(dispatchMock);
    useSelector.mockImplementation((selector) => selector(defaultState));
  });

  it('triggers zoom and fullscreen handlers through icon buttons', () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    const onReset = jest.fn();
    const onFullscreen = jest.fn();

    renderComponent({
      onZoomIn,
      onZoomOut,
      onReset,
      onFullscreen,
    });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[3]);

    expect(onZoomOut).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
    expect(onZoomIn).toHaveBeenCalled();
    expect(onFullscreen).toHaveBeenCalled();
  });

  it('enables tag map mode and dispatches type change when switching from subcategory', () => {
    const setShowProductNameTag = jest.fn();
    const state = {
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

    useSelector.mockImplementation((selector) => selector(state));

    renderComponent({
      setShowProductNameTag,
    });

    fireEvent.click(screen.getByText('Tag Map'));

    expect(setShowProductNameTag).toHaveBeenCalledWith(false);
    expect(mockSetTagMapFilters).toHaveBeenCalledWith({ selectedType: 'brand' });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedType: 'brand' },
    });
  });

  it('dispatches tag map filter updates for brand selections including Select All', () => {
    let currentState = {
      ...defaultState,
      planogramVisualizer: {
        ...defaultState.planogramVisualizer,
        tagMapFilters: {
          selectedType: 'brand',
          selectedBrands: [],
          selectedSubCategories: [],
        },
      },
    };

    useSelector.mockImplementation((selector) => selector(currentState));

    renderComponent({
      showProductNameTag: false,
    });

    const activeAutocompletes = autocompleteRegistry.filter(Boolean);
    expect(activeAutocompletes).toHaveLength(1);

    act(() => {
      activeAutocompletes[0].onChange(null, ['Brand 1']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedBrands: ['Brand 1'],
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedBrands: ['Brand 1'] },
    });

    mockSetTagMapFilters.mockClear();
    dispatchMock.mockClear();

    act(() => {
      activeAutocompletes[0].onChange(null, ['Select All']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedBrands: ['Brand 1', 'Brand 2'],
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedBrands: ['Brand 1', 'Brand 2'] },
    });
  });

  it('does not dispatch type change when Tag Map already on brand', () => {
    const setShowProductNameTag = jest.fn();

    renderComponent({
      setShowProductNameTag,
    });

    fireEvent.click(screen.getByText('Tag Map'));

    expect(setShowProductNameTag).toHaveBeenCalledWith(false);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('hides tag map selects when labels view active', () => {
    renderComponent();
    expect(autocompleteRegistry.find(Boolean)).toBeUndefined();
  });

  it('deselects all brands when Select All is used while everything selected', () => {
    const richState = {
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
      dataTemplate: {
        masterProductBrands: ['Brand 1', 'Brand 2', 'Brand 3'],
        masterProductSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
      },
    };

    useSelector.mockImplementation((selector) => selector(richState));

    renderComponent({
      showProductNameTag: false,
    });

    const autocomplete = autocompleteRegistry.find(Boolean);
    expect(autocomplete).toBeTruthy();

    act(() => {
      autocomplete.onChange(null, ['Select All']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({ selectedBrands: [] });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedBrands: [] },
    });
  });

  it('handles subcategory selections and select all toggling', () => {
    const subcategoryState = {
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
      dataTemplate: {
        masterProductBrands: ['Brand 1', 'Brand 2', 'Brand 3'],
        masterProductSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
      },
    };

    useSelector.mockImplementation((selector) => selector(subcategoryState));

    renderComponent({
      showProductNameTag: false,
    });

    const autocomplete = autocompleteRegistry.find(Boolean);
    expect(autocomplete).toBeTruthy();

    act(() => {
      autocomplete.onChange(null, ['Sub 1']);
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedSubCategories: ['Sub 1'] },
    });

    mockSetTagMapFilters.mockClear();
    dispatchMock.mockClear();

    act(() => {
      autocomplete.onChange(null, ['Select All']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'] },
    });
  });

  it('deselects all subcategories when Select All used while all selected', () => {
    const fullState = {
      ...defaultState,
      planogramVisualizer: {
        ...defaultState.planogramVisualizer,
        tagMapFilters: {
          selectedType: 'subcategory',
          selectedBrands: [],
          selectedSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
        },
        planogramProducts: [
          { brand: 'Brand 1', subCategory: 'Sub 1' },
          { brand: 'Brand 2', subCategory: 'Sub 2' },
          { brand: 'Brand 3', subCategory: 'Sub 3' },
        ],
      },
      dataTemplate: {
        masterProductBrands: ['Brand 1', 'Brand 2', 'Brand 3'],
        masterProductSubCategories: ['Sub 1', 'Sub 2', 'Sub 3'],
      },
    };

    useSelector.mockImplementation((selector) => selector(fullState));

    renderComponent({
      showProductNameTag: false,
    });

    const autocomplete = autocompleteRegistry.find(Boolean);
    expect(autocomplete).toBeTruthy();

    act(() => {
      autocomplete.onChange(null, ['Select All']);
    });

    expect(mockSetTagMapFilters).toHaveBeenCalledWith({
      selectedSubCategories: [],
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'planogram/setTagMapFilters',
      payload: { selectedSubCategories: [] },
    });
  });

  it('allows toggling back to labels view', () => {
    const setShowProductNameTag = jest.fn();

    renderComponent({
      setShowProductNameTag,
      showProductNameTag: false,
    });

    fireEvent.click(screen.getByText('Labels'));
    expect(setShowProductNameTag).toHaveBeenCalledWith(true);
  });

  it('changes tag map type using select control', () => {
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
});

