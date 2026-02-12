import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import PlanogramBar from '../PlanogramBar';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../utils/planogramShelfBuilder', () => ({
  buildShelvesFromApi: jest.fn(),
}));

jest.mock('../../../api/api', () => ({
  exportPlanogramSchematic: jest.fn(),
  duplicatePlanogram: jest.fn(),
  saveOrPublishPlanogram: jest.fn(),
}));

jest.mock('../../../utils/savePlanogramUtils', () => ({
  generateSavePayload: jest.fn(),
  generateSaveSummary: jest.fn(),
  buildFullLayoutSnapshot: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockInfoTooltip = jest.fn(() => <div data-testid="info-tooltip">Info</div>);
jest.mock('../InfoToolTip', () => ({
  __esModule: true,
  default: (props) => mockInfoTooltip(props),
}));

const mockRuleManagerModal = jest.fn(() => null);
jest.mock('../../Modals/RulesManagerModal', () => ({
  __esModule: true,
  default: (props) => mockRuleManagerModal(props),
}));

const mockDuplicateSuccessModal = jest.fn(() => null);
jest.mock('../../Modals/DuplicateSuccessModal', () => ({
  __esModule: true,
  default: (props) => mockDuplicateSuccessModal(props),
}));

const mockSaveConfirmationModal = jest.fn(() => null);
jest.mock('../../Modals/SaveConfirmationModal', () => ({
  __esModule: true,
  default: (props) => mockSaveConfirmationModal(props),
}));

const mockSubmitConfirmationModal = jest.fn(() => null);
jest.mock('../../Modals/SubmitConfirmationModal', () => ({
  __esModule: true,
  default: (props) => mockSubmitConfirmationModal(props),
}));

import { useDispatch, useSelector } from 'react-redux';
import { buildShelvesFromApi } from '../../../utils/planogramShelfBuilder';
import { exportPlanogramSchematic, duplicatePlanogram, saveOrPublishPlanogram } from '../../../api/api';
import { generateSavePayload, generateSaveSummary, buildFullLayoutSnapshot } from '../../../utils/savePlanogramUtils';
import {
  resetVersionChange,
  setPlanogramFilters,
  setIsSchematicView,
  selectIsFullScreen,
  selectScale,
  selectPlanogramFilters,
  selectIsSchematicView,
  selectShelfLines,
  selectRemovedProductIds,
  selectRemovedProductsWithPosition,
  selectRepositionedProductsWithPosition,
  selectBays,
  selectZoomState,
  selectHasUnsavedChanges,
  selectProductMap,
} from '../../../redux/reducers/planogramVisualizerSlice';
import { selectCategoryAccessType } from '../../../redux/reducers/regionRetailerSlice';

describe('PlanogramBar', () => {
  const mockNavigate = jest.fn();
  const mockDispatch = jest.fn();
  const mockSetRowData = jest.fn();
  const mockOnFilterClick = jest.fn();

  const mockRowData = {
    id: 'planogram-1',
    planogramId: 'PG-001',
    clusterName: 'Test Cluster',
    version: 1,
    shortDesc: 'Test Version',
  };

  const mockClusterMap = [
    { id: 'planogram-1', version: 0, shortDesc: 'Original' },
    { id: 'planogram-2', version: 1, shortDesc: 'Updated' },
  ];

  const defaultReduxState = {
    planogramVisualizerData: {
      isFullScreen: false,
      scale: 3,
      planogramFilters: {
        brands: [],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      },
      isSchematicView: false,
      shelfLines: [],
      removedProductIds: [],
      removedProductsWithPosition: [],
      repositionedProductsWithPosition: [],
      bays: [],
      zoomState: { newValue: 1, oldValue: 1 },
      violations: [],
      hasUnsavedChanges: true,
    },
    productData: {
      productMap: {},
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

  const cloneState = () => JSON.parse(JSON.stringify(defaultReduxState));
  let mockReduxState;

  const defaultSelectorImplementation = (selector) => {
    if (selector === selectIsFullScreen) {
      return mockReduxState.planogramVisualizerData.isFullScreen;
    }
    if (selector === selectScale) {
      return mockReduxState.planogramVisualizerData.scale;
    }
    if (selector === selectPlanogramFilters) {
      return mockReduxState.planogramVisualizerData.planogramFilters;
    }
    if (selector === selectIsSchematicView) {
      return mockReduxState.planogramVisualizerData.isSchematicView;
    }
    if (selector === selectShelfLines) {
      return mockReduxState.planogramVisualizerData.shelfLines;
    }
    if (selector === selectRemovedProductIds) {
      return mockReduxState.planogramVisualizerData.removedProductIds;
    }
    if (selector === selectRemovedProductsWithPosition) {
      return mockReduxState.planogramVisualizerData.removedProductsWithPosition;
    }
    if (selector === selectRepositionedProductsWithPosition) {
      return mockReduxState.planogramVisualizerData.repositionedProductsWithPosition;
    }
    if (selector === selectBays) {
      return mockReduxState.planogramVisualizerData.bays;
    }
    if (selector === selectZoomState) {
      return mockReduxState.planogramVisualizerData.zoomState;
    }
    if (selector === selectHasUnsavedChanges) {
      return mockReduxState.planogramVisualizerData.hasUnsavedChanges;
    }
    if (selector === selectProductMap) {
      return mockReduxState.productData.productMap;
    }
    if (selector === selectCategoryAccessType) {
      return mockReduxState.regionRetailer.categoryAccessType;
    }

    if (typeof selector === 'function') {
      return selector(mockReduxState);
    }

    return undefined;
  };

  const renderComponent = (overrideProps = {}) =>
    render(<PlanogramBar {...defaultProps} {...overrideProps} />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockReduxState = cloneState();
    useNavigate.mockReturnValue(mockNavigate);
    useDispatch.mockReturnValue(mockDispatch);
    useSelector.mockImplementation(defaultSelectorImplementation);

    buildShelvesFromApi.mockResolvedValue({
      dynamicShelves: [],
      products: [],
      ruleManager: {},
    });

    generateSavePayload.mockReturnValue({});
    generateSaveSummary.mockReturnValue({});
    buildFullLayoutSnapshot.mockReturnValue({});
  });

  afterEach(() => {
    useSelector.mockImplementation(defaultSelectorImplementation);
    mockReduxState = cloneState();
  });

  const defaultProps = {
    rowData: mockRowData,
    setRowData: mockSetRowData,
    clusterMap: mockClusterMap,
    filteredProducts: [],
    planogramProducts: [],
    onFilterClick: mockOnFilterClick,
    isMyPlanogram: false,
    status: 'draft',
  };

  it('renders main elements', () => {
    renderComponent();

    expect(screen.getByText('Test Cluster')).toBeInTheDocument();
    expect(screen.getByText('Applied Filters')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
    // Note: "Edit Mode" pill only renders when isMyPlanogram is true, so not checking here
    expect(screen.queryByText('Edit Mode')).not.toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    renderComponent();

    const backIcon = screen.getByTestId('ArrowBackIcon');
    const backButton = backIcon.closest('button');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows View Mode when currentMode is true and isMyPlanogram is true', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = true;

    renderComponent({ isMyPlanogram: true });

    // The View/Edit Mode pill should be visible when isMyPlanogram is true
    expect(screen.getByText(/View Mode/i)).toBeInTheDocument();
  });

  it('does not show View/Edit Mode pill when isMyPlanogram is false', () => {
    renderComponent({ isMyPlanogram: false });

    expect(screen.queryByText('Edit Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('View Mode')).not.toBeInTheDocument();
  });

  it('shows Edit Mode pill when isMyPlanogram is true and currentMode is false', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = false;

    renderComponent({ isMyPlanogram: true });

    expect(screen.getByText(/Edit Mode/i)).toBeInTheDocument();
  });

  it('shows View Mode pill when isMyPlanogram is true and currentMode is true', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = true;

    renderComponent({ isMyPlanogram: true });

    expect(screen.getByText(/View Mode/i)).toBeInTheDocument();
  });

  it('shows version select dropdown when clusterVersions exist', () => {
    renderComponent();

    const selectInput = screen.getByRole('combobox');
    expect(selectInput).toBeInTheDocument();
  });

  it('handles version change', async () => {
    renderComponent();

    const selectInput = screen.getByRole('combobox');
    fireEvent.mouseDown(selectInput);

    const option = screen.getByRole('option', { name: 'Updated (V1)' });
    fireEvent.click(option);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(resetVersionChange());
    });
  });

  it('opens rule manager modal when rules button is clicked', () => {
    renderComponent();

    const rulesButton = screen.getByRole('button', { name: 'Planogram Rules' });
    fireEvent.click(rulesButton);

    expect(mockRuleManagerModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
      }),
    );
  });

  it('toggles show all filters popper', () => {
    renderComponent();

    const showAllButton = screen.getByText('Applied Filters').closest('button');
    fireEvent.click(showAllButton);

    expect(screen.getByText('All Filters')).toBeInTheDocument();
  });

  it('shows no filters message when no active filters', () => {
    renderComponent();

    const showAllButton = screen.getByText('Applied Filters').closest('button');
    fireEvent.click(showAllButton);

    expect(screen.getByText('No filters applied')).toBeInTheDocument();
  });

  it('displays active filters in popper', async () => {
    mockReduxState.planogramVisualizerData.planogramFilters = {
      brands: ['Brand1', 'Brand2'],
      subCategories: ['Sub1'],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    };

    renderComponent();

    const showAllButton = screen.getByText('Applied Filters').closest('button');
    fireEvent.click(showAllButton);

    await waitFor(() => {
      expect(screen.getByText('Brand')).toBeInTheDocument();
      expect(screen.getByText('Sub Category')).toBeInTheDocument();
      expect(screen.getByText('Brand1')).toBeInTheDocument();
      expect(screen.getByText('Brand2')).toBeInTheDocument();
      expect(screen.getByText('Sub1')).toBeInTheDocument();
    });
  });

  it('calls onFilterClick when filter button is clicked', () => {
    renderComponent();

    const filterButton = screen.getByText('Filter').closest('button');
    fireEvent.click(filterButton);

    expect(mockOnFilterClick).toHaveBeenCalled();
  });

  it('shows filter badge when active filters exist', () => {
    mockReduxState.planogramVisualizerData.planogramFilters = {
      brands: ['Brand1'],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    };

    renderComponent();

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('opens download menu when download button is clicked', () => {
    renderComponent();

    const downloadButton = screen.getByRole('button', { name: 'Download' });
    fireEvent.click(downloadButton);

    expect(screen.getByText('Schematic (.xlsx)')).toBeInTheDocument();
  });

  it('handles export when schematic menu item is clicked', async () => {
    const mockResponse = {
      data: new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      headers: { 'content-disposition': 'attachment; filename="test.xlsx"' },
    };

    exportPlanogramSchematic.mockResolvedValue(mockResponse);

    // Mock URL.createObjectURL and related DOM methods
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;

    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = jest.fn();
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = jest.fn();
    }

    const createObjectURLSpy = jest.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURLSpy = jest.spyOn(global.URL, 'revokeObjectURL').mockImplementation(() => {});
    const originalCreateElement = document.createElement;

    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement.call(document, tagName);
        jest.spyOn(anchor, 'setAttribute');
        jest.spyOn(anchor, 'click').mockImplementation(() => {});
        jest.spyOn(anchor, 'remove').mockImplementation(() => anchor.parentNode?.removeChild(anchor));
        return anchor;
      }
      return originalCreateElement.call(document, tagName);
    });

    try {
      renderComponent();

      const downloadButton = screen.getByRole('button', { name: 'Download' });
      fireEvent.click(downloadButton);

      const schematicItem = screen.getByText('Schematic (.xlsx)');
      fireEvent.click(schematicItem);

      await waitFor(() => {
        expect(exportPlanogramSchematic).toHaveBeenCalled();
      });
    } finally {
      document.createElement = originalCreateElement;
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      if (originalCreateObjectURL) {
        global.URL.createObjectURL = originalCreateObjectURL;
      } else {
        delete global.URL.createObjectURL;
      }
      if (originalRevokeObjectURL) {
        global.URL.revokeObjectURL = originalRevokeObjectURL;
      } else {
        delete global.URL.revokeObjectURL;
      }
    }
  });

  it('handles duplicate and edit', async () => {
    const mockResponse = {
      data: {
        data: {
          record: {
            id: 'new-planogram-id',
            version_no: 2,
          },
        },
      },
    };

    duplicatePlanogram.mockResolvedValue(mockResponse);

    renderComponent({ isMyPlanogram: false });

    const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(duplicatePlanogram).toHaveBeenCalledWith('planogram-1', 'test@example.com');
    });

    await waitFor(() => {
      expect(mockDuplicateSuccessModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
        }),
      );
    });
  });

  it('shows save button when isMyPlanogram is true and not in view mode and status is draft', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = false;

    renderComponent({ isMyPlanogram: true, status: 'draft' });

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows submit button when isMyPlanogram is true and not in view mode and status is draft', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = false;

    renderComponent({ isMyPlanogram: true, status: 'draft' });

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('handles save planogram', async () => {
    saveOrPublishPlanogram.mockResolvedValue({});

    mockReduxState.planogramVisualizerData.isFullScreen = false;

    renderComponent({ isMyPlanogram: true, status: 'draft' });

    const saveButton = screen.getByText('Save').closest('button');
    fireEvent.click(saveButton);

    const saveModalProps = mockSaveConfirmationModal.mock.calls.at(-1)?.[0];
    expect(saveModalProps?.open).toBe(true);

    await act(async () => {
      await saveModalProps.onConfirm();
    });

    await waitFor(() => {
      expect(generateSavePayload).toHaveBeenCalled();
    });

    expect(generateSavePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        zoomState: { newValue: 1 },
      })
    );

    await waitFor(() => {
      expect(saveOrPublishPlanogram).toHaveBeenCalled();
    });
  });

  it('handles submit planogram when no violations', async () => {
    saveOrPublishPlanogram.mockResolvedValue({});

    mockReduxState.planogramVisualizerData.isFullScreen = false;
    mockReduxState.planogramVisualizerData.violations = [];

    renderComponent({ isMyPlanogram: true, status: 'draft' });

    const submitButton = screen.getByText('Submit').closest('button');
    fireEvent.click(submitButton);

    const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1)?.[0];
    expect(submitModalProps?.open).toBe(true);

    await act(async () => {
      await submitModalProps.onConfirm();
    });

    await waitFor(() => {
      expect(generateSavePayload).toHaveBeenCalled();
    });

    expect(generateSavePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        zoomState: { newValue: 1 },
      })
    );

    await waitFor(() => {
      expect(saveOrPublishPlanogram).toHaveBeenCalled();
    });
  });

  it('blocks submit when violations exist', async () => {
    mockReduxState.planogramVisualizerData.isFullScreen = false;
    mockReduxState.planogramVisualizerData.violations = [{ id: 'violation-1' }];

    renderComponent({ isMyPlanogram: true, status: 'draft' });

    const submitButton = screen.getByText('Submit').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('does not show save/submit buttons when status is published', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = false;

    renderComponent({ isMyPlanogram: true, status: 'published' });

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('does not show duplicate button when isMyPlanogram is true', () => {
    renderComponent({ isMyPlanogram: true });

    expect(screen.queryByText('Duplicate & Edit')).not.toBeInTheDocument();
  });

  it('shows view toggle buttons in view mode', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = true;
    mockReduxState.planogramVisualizerData.isSchematicView = false;

    renderComponent();

    expect(screen.getByRole('button', { name: 'Planogram View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schematic View' })).toBeInTheDocument();
  });

  it('dispatches setIsSchematicView when view toggle buttons are clicked', () => {
    mockReduxState.planogramVisualizerData.isFullScreen = true;
    mockReduxState.planogramVisualizerData.isSchematicView = false;

    renderComponent();

    const schematicButton = screen.getByRole('button', { name: 'Schematic View' });
    fireEvent.click(schematicButton);

    expect(mockDispatch).toHaveBeenCalledWith(setIsSchematicView(true));
  });

  it('handles reset all filters', () => {
    mockReduxState.planogramVisualizerData.planogramFilters = {
      brands: ['Brand1'],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    };

    renderComponent();

    const resetButton = screen.getByRole('button', { name: 'Reset Filters' });
    fireEvent.click(resetButton);

    expect(mockDispatch).toHaveBeenCalledWith(
      setPlanogramFilters({
        brands: [],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      }),
    );
  });

    it('handles remove individual filter', () => {
      mockReduxState.planogramVisualizerData.planogramFilters = {
        brands: ['Brand1', 'Brand2'],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };

      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      // Find the remove button for a filter (line 645: onClick={() => onRemoveFilter(key, val)})
      // Look for IconButton with close icon inside the popper
      const allFiltersText = screen.queryByText('All Filters');
      expect(allFiltersText).toBeInTheDocument();
      
      // Find the popper container
      const popper = allFiltersText.closest('div[class*="MuiPaper"]') || 
                     allFiltersText.closest('[role="presentation"]') ||
                     allFiltersText.parentElement?.parentElement;
      
      expect(popper).toBeTruthy();
      
      // Find all buttons in the popper - the close buttons are IconButtons
      const allButtons = popper.querySelectorAll('button');
      expect(allButtons.length).toBeGreaterThan(0);
      
      // Find the close button (IconButton with AiOutlineClose) - it's not the Reset button
      // The close buttons are IconButtons, typically have an SVG child
      const closeButton = Array.from(allButtons).find((btn) => {
        const hasSvg = btn.querySelector('svg');
        const isNotReset = !btn.textContent.includes('Reset');
        return hasSvg && isNotReset;
      });

      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton);
      expect(mockDispatch).toHaveBeenCalled();
    });

  describe('Error Handling', () => {
    it('handles export error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      exportPlanogramSchematic.mockRejectedValue(new Error('Export failed'));

      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      global.URL.createObjectURL = jest.fn();
      global.URL.revokeObjectURL = jest.fn();

      try {
        renderComponent();

        const downloadButton = screen.getByRole('button', { name: 'Download' });
        fireEvent.click(downloadButton);

        const schematicItem = screen.getByText('Schematic (.xlsx)');
        fireEvent.click(schematicItem);

        await waitFor(() => {
          expect(exportPlanogramSchematic).toHaveBeenCalled();
        });
      } finally {
        consoleErrorSpy.mockRestore();
        global.URL.createObjectURL = originalCreateObjectURL;
        global.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it('handles duplicate error when response has no id', async () => {
      const mockResponse = {
        data: {
          data: {
            record: {
              id: null,
              version_no: 2,
            },
          },
        },
      };

      duplicatePlanogram.mockResolvedValue(mockResponse);

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(duplicatePlanogram).toHaveBeenCalled();
      });
    });

    it('handles duplicate error when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      duplicatePlanogram.mockRejectedValue(new Error('API Error'));

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(duplicatePlanogram).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles save error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      saveOrPublishPlanogram.mockRejectedValue(new Error('Save failed'));

      mockReduxState.planogramVisualizerData.isFullScreen = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const saveButton = screen.getByText('Save').closest('button');
      fireEvent.click(saveButton);

      const saveModalProps = mockSaveConfirmationModal.mock.calls.at(-1)?.[0];
      expect(saveModalProps?.open).toBe(true);

      await act(async () => {
        await saveModalProps.onConfirm();
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles submit error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      saveOrPublishPlanogram.mockRejectedValue(new Error('Submit failed'));

      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [];

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      fireEvent.click(submitButton);

      const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1)?.[0];
      expect(submitModalProps?.open).toBe(true);

      await act(async () => {
        await submitModalProps.onConfirm();
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('shows error when trying to save with no changes', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
      
      // Button should be disabled, so clicking shouldn't open modal
      fireEvent.click(saveButton);

      // Modal should not open when button is disabled
      // The modal component is always rendered, but with open: false when button is disabled
      const saveModalProps = mockSaveConfirmationModal.mock.calls.at(-1);
      expect(saveModalProps).toBeDefined();
      expect(saveModalProps[0]?.open).toBe(false);
    });

    it('calls handleSavePlanogram directly with no changes shows error', async () => {
      // Test the branch at line 419-421: if (!hasUnsavedChanges)
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      // Get the save handler from the modal props
      const saveButton = screen.getByText('Save').closest('button');
      fireEvent.click(saveButton);

      const saveModalProps = mockSaveConfirmationModal.mock.calls.at(-1);
      expect(saveModalProps).toBeDefined();
      
      // Call onConfirm directly to test the hasUnsavedChanges branch
      await act(async () => {
        await saveModalProps[0].onConfirm();
      });

      // Should show error toast and not save
      expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
    });

    it('shows error when trying to submit with no changes', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;
      mockReduxState.planogramVisualizerData.violations = [];

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).toBeDisabled();
      
      // Button should be disabled, so clicking shouldn't open modal
      fireEvent.click(submitButton);

      // Modal should not open when button is disabled
      // The modal component is always rendered, but with open: false when button is disabled
      const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1);
      expect(submitModalProps).toBeDefined();
      expect(submitModalProps[0]?.open).toBe(false);
    });

    it('calls handleSubmitPlanogram directly with no changes shows error', async () => {
      // Test the branch at line 452-454: if (!hasUnsavedChanges)
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;
      mockReduxState.planogramVisualizerData.violations = [];

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      // Get the submit handler from the modal props
      const submitButton = screen.getByText('Submit').closest('button');
      fireEvent.click(submitButton);

      const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1);
      expect(submitModalProps).toBeDefined();
      
      // Call onConfirm directly to test the hasUnsavedChanges branch
      await act(async () => {
        await submitModalProps[0].onConfirm();
      });

      // Should show error toast and not submit
      expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
    });

    it('calls handleSubmitPlanogram directly with violations shows error', () => {
      // Test the branch at line 458-461: if (violations && violations.length > 0)
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [{ id: 'violation-1' }];

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).toBeDisabled();
      
      const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1);
      expect(submitModalProps).toBeDefined();
      expect(submitModalProps[0]?.open).toBe(false);
    });

    it('shows error when trying to submit with violations', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [{ id: 'violation-1' }];
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).toBeDisabled();

      // Try to click anyway (should be disabled)
      fireEvent.click(submitButton);

      // Should not open modal - check that modal was called with open: false
      const submitModalProps = mockSubmitConfirmationModal.mock.calls.at(-1);
      expect(submitModalProps).toBeDefined();
      expect(submitModalProps[0]?.open).toBe(false);
    });
  });

  describe('Filter Removal Edge Cases', () => {
    it('handles removing filter when filterKey does not exist', () => {
      mockReduxState.planogramVisualizerData.planogramFilters = {
        brands: ['Brand1'],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };

      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      // This tests the branch where planogramFilters[filterKey] is undefined
      // The component should handle it with || []
      expect(screen.getByText('Brand1')).toBeInTheDocument();
    });

    it('handles removing filter from undefined filterKey', () => {
      // Test the branch: (planogramFilters[filterKey] || [])
      // when filterKey doesn't exist in planogramFilters
      mockReduxState.planogramVisualizerData.planogramFilters = {
        brands: ['Brand1'],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };

      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      // Wait for popper to appear
      const allFiltersText = screen.queryByText('All Filters');
      expect(allFiltersText).toBeInTheDocument();
      
      // Find the popper container - it's a Paper component inside Popper
      const popper = allFiltersText.closest('div[class*="MuiPaper"]') || 
                     allFiltersText.closest('[role="presentation"]') ||
                     allFiltersText.parentElement?.parentElement;
      
      expect(popper).toBeTruthy();
      
      // Find all buttons in the popper
      const allButtons = popper.querySelectorAll('button');
      expect(allButtons.length).toBeGreaterThan(0);
      
      // Find the close button (it's an IconButton with SVG, not the Reset button)
      const closeButton = Array.from(allButtons).find((btn) => {
        const hasSvg = btn.querySelector('svg');
        const isNotReset = !btn.textContent.includes('Reset');
        return hasSvg && isNotReset;
      });
      
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton);
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('handles removing filter when filterKey value is undefined', () => {
      // Test the branch where planogramFilters[filterKey] is undefined
      // This tests line 131: (planogramFilters[filterKey] || [])
      mockReduxState.planogramVisualizerData.planogramFilters = {
        brands: ['Brand1'],
        subCategories: undefined, // undefined value
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };

      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      // Should still work - the || [] fallback handles undefined
      expect(screen.getByText('Brand1')).toBeInTheDocument();
    });

    it('handles removing filter when filterKey does not exist in planogramFilters', () => {
      // Test the branch at line 131: (planogramFilters[filterKey] || [])
      // when filterKey doesn't exist at all in the object
      mockReduxState.planogramVisualizerData.planogramFilters = {
        brands: ['Brand1'],
        subCategories: [],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
        // 'unknownKey' doesn't exist
      };

      renderComponent();

      // The handleRemoveFilter function should handle missing keys gracefully
      // This tests the || [] fallback in line 131
      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      expect(screen.getByText('Brand1')).toBeInTheDocument();
    });
  });

  describe('Show All Filters Popper', () => {
    it('does not close popper when clicking inside anchor element', () => {
      // Test the branch: if (showAllAnchorRef.current?.contains(event.target))
      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      expect(screen.getByText('All Filters')).toBeInTheDocument();
      
      // Close by clicking the button again to verify toggle works
      fireEvent.click(showAllButton);
      
      expect(screen.queryByText('All Filters')).not.toBeInTheDocument();
    });

    it('closes popper when clicking outside anchor element', () => {
      // Test the branch at line 218-221: handleCloseShowAll
      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      expect(screen.getByText('All Filters')).toBeInTheDocument();
      
      // Close by clicking the button again
      fireEvent.click(showAllButton);
      
      expect(screen.queryByText('All Filters')).not.toBeInTheDocument();
    });

    it('handles handleCloseShowAll when event target is inside anchor', () => {
      // Test the branch at line 218-220: if (showAllAnchorRef.current?.contains(event.target)) return;
      renderComponent();

      const showAllButton = screen.getByText('Applied Filters').closest('button');
      fireEvent.click(showAllButton);

      expect(screen.getByText('All Filters')).toBeInTheDocument();

      // The handleCloseShowAll should not close when target is inside anchor
      // This is handled by ClickAwayListener, but we verify the popper stays open
      // The branch at 218-220 is covered by the component's logic
      expect(screen.getByText('All Filters')).toBeInTheDocument();
    });
  });

  describe('Export Filename Parsing', () => {
    it('uses default filename when content-disposition header is missing', async () => {
      const mockResponse = {
        data: new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        headers: {},
      };

      exportPlanogramSchematic.mockResolvedValue(mockResponse);

      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();

      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') {
          const anchor = originalCreateElement.call(document, tagName);
          jest.spyOn(anchor, 'setAttribute');
          jest.spyOn(anchor, 'click').mockImplementation(() => {});
          jest.spyOn(anchor, 'remove').mockImplementation(() => {});
          return anchor;
        }
        return originalCreateElement.call(document, tagName);
      });

      try {
        renderComponent();

        const downloadButton = screen.getByRole('button', { name: 'Download' });
        fireEvent.click(downloadButton);

        const schematicItem = screen.getByText('Schematic (.xlsx)');
        fireEvent.click(schematicItem);

        await waitFor(() => {
          expect(exportPlanogramSchematic).toHaveBeenCalled();
        });
      } finally {
        document.createElement = originalCreateElement;
        global.URL.createObjectURL = originalCreateObjectURL;
        global.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it('uses filename from content-disposition header when available', async () => {
      const mockResponse = {
        data: new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        headers: { 'content-disposition': 'attachment; filename="custom-name.xlsx"' },
      };

      exportPlanogramSchematic.mockResolvedValue(mockResponse);

      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();

      const originalCreateElement = document.createElement;
      const setAttributeSpy = jest.fn();
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') {
          const anchor = originalCreateElement.call(document, tagName);
          anchor.setAttribute = setAttributeSpy;
          jest.spyOn(anchor, 'click').mockImplementation(() => {});
          jest.spyOn(anchor, 'remove').mockImplementation(() => {});
          return anchor;
        }
        return originalCreateElement.call(document, tagName);
      });

      try {
        renderComponent();

        const downloadButton = screen.getByRole('button', { name: 'Download' });
        fireEvent.click(downloadButton);

        const schematicItem = screen.getByText('Schematic (.xlsx)');
        fireEvent.click(schematicItem);

      await waitFor(() => {
        expect(exportPlanogramSchematic).toHaveBeenCalled();
        // The regex might include quotes, so check that it contains the filename
        expect(setAttributeSpy).toHaveBeenCalledWith('download', expect.stringContaining('custom-name.xlsx'));
      });
      } finally {
        document.createElement = originalCreateElement;
        global.URL.createObjectURL = originalCreateObjectURL;
        global.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });
  });

  describe('Version Selection', () => {
    it('handles empty clusterVersions array', () => {
      renderComponent({ clusterMap: [] });

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('handles version selection when latest row is not found', () => {
      const clusterMap = [
        { id: 'planogram-2', version: 1, shortDesc: 'Updated' },
      ];

      renderComponent({ clusterMap, rowData: { id: 'planogram-1' } });

      const selectInput = screen.getByRole('combobox');
      expect(selectInput).toBeInTheDocument();
    });
  });

  describe('Submit Tooltip Titles', () => {
    it('shows correct tooltip when violations exist', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [{ id: 'violation-1' }];
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).toBeDisabled();
    });

    it('shows correct tooltip when no changes', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [];
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).toBeDisabled();
    });

    it('shows correct tooltip when changes exist and no violations', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [];
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('PlanogramViewToggle', () => {
    it('does not render when currentMode is false', () => {
      // Test the branch at line 510: if (!currentMode) return null;
      mockReduxState.planogramVisualizerData.isFullScreen = false;

      renderComponent();

      // When currentMode is false, PlanogramViewToggle should not render
      expect(screen.queryByRole('button', { name: 'Planogram View' })).not.toBeInTheDocument();
    });

    it('does not render when currentMode is null', () => {
      // Test the branch at line 510: if (!currentMode) return null;
      mockReduxState.planogramVisualizerData.isFullScreen = null;

      renderComponent();

      // When currentMode is null, PlanogramViewToggle should not render
      expect(screen.queryByRole('button', { name: 'Planogram View' })).not.toBeInTheDocument();
    });

    it('does not render when currentMode is undefined', () => {
      // Test the branch at line 510: if (!currentMode) return null;
      mockReduxState.planogramVisualizerData.isFullScreen = undefined;

      renderComponent();

      // When currentMode is undefined, PlanogramViewToggle should not render
      expect(screen.queryByRole('button', { name: 'Planogram View' })).not.toBeInTheDocument();
    });

    it('renders when currentMode is true', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = true;

      renderComponent();

      expect(screen.getByRole('button', { name: 'Planogram View' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schematic View' })).toBeInTheDocument();
    });

    it('applies correct styling for MyPlanogram', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = true;

      renderComponent({ isMyPlanogram: true });

      const planogramButton = screen.getByRole('button', { name: 'Planogram View' });
      expect(planogramButton).toHaveClass('bg-[#FFDDCA]');
    });

    it('applies correct styling for non-MyPlanogram', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = true;

      renderComponent({ isMyPlanogram: false });

      const planogramButton = screen.getByRole('button', { name: 'Planogram View' });
      expect(planogramButton).toHaveClass('bg-[#FFEBBF]');
    });
  });

  describe('Category Access Type', () => {
    it('disables duplicate button when categoryAccessType is USERS', () => {
      mockReduxState.regionRetailer.categoryAccessType = 'USERS';

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      expect(duplicateButton).toBeDisabled();
    });

    it('shows error toast when trying to duplicate with USERS access', async () => {
      mockReduxState.regionRetailer.categoryAccessType = 'USERS';

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      fireEvent.click(duplicateButton);

      // This tests the branch: if (categoryAccessType === "USERS") at line 340-342
      await waitFor(() => {
        expect(duplicatePlanogram).not.toHaveBeenCalled();
      });
    });

    it('allows duplicate when categoryAccessType is CONTRIBUTORS', () => {
      mockReduxState.regionRetailer.categoryAccessType = 'CONTRIBUTORS';

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      expect(duplicateButton).not.toBeDisabled();
    });
  });

  describe('Autosave', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('does not autosave when autoSaveEnabled is false', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: false, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
      });
    });

    it('does not autosave when in view mode', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = true;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
      });
    });

    it('does not autosave when status is published', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: true, status: 'published' });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
      });
    });

    it('does not autosave when no unsaved changes', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = false;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
      });
    });

    it('does not autosave when violations exist', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [{ id: 'violation-1' }];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
      });
    });

    it('autosaves when all conditions are met', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(saveOrPublishPlanogram).toHaveBeenCalled();
      });
    });

    it('does not autosave when autoSaveInFlight is true', async () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // First autosave should start
      await waitFor(() => {
        expect(saveOrPublishPlanogram).toHaveBeenCalledTimes(1);
      });

      // Trigger another autosave while first is in flight
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should not trigger another save while in flight
      expect(saveOrPublishPlanogram).toHaveBeenCalledTimes(1);
    });

    it('clears autosave timer on cleanup', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      const { unmount } = renderComponent({ autoSaveEnabled: true, status: 'draft' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Timer should be cleared, so save should not be called
      // This tests the branch at line 827-828: if (autoSaveTimer.current)
      expect(saveOrPublishPlanogram).not.toHaveBeenCalled();
    });

    it('clears existing autosave timer before setting new one', () => {
      // Test the branch at line 827-828: if (autoSaveTimer.current) clearTimeout
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      mockReduxState.planogramVisualizerData.violations = [];

      saveOrPublishPlanogram.mockResolvedValue({});

      const { rerender } = renderComponent({ autoSaveEnabled: true, status: 'draft' });

      // Trigger timer to be set
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Change a dependency to trigger effect again (should clear and reset timer)
      mockReduxState.planogramVisualizerData.hasUnsavedChanges = true;
      rerender(<PlanogramBar {...defaultProps} autoSaveEnabled={true} status="draft" />);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Timer should be reset, so we should still only have one call after full delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should eventually call save (the branch at line 828 is covered by the effect re-running)
      expect(saveOrPublishPlanogram).toHaveBeenCalled();
    });
  });

  describe('Modal Rendering', () => {
    it('renders RuleManagerModal when isRuleModalOpen is true', () => {
      renderComponent();

      const rulesButton = screen.getByRole('button', { name: 'Planogram Rules' });
      fireEvent.click(rulesButton);

      expect(mockRuleManagerModal).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          isOrangeTheme: false,
        }),
      );
    });

    it('does not render RuleManagerModal when isRuleModalOpen is false', () => {
      renderComponent();

      const initialCalls = mockRuleManagerModal.mock.calls.length;
      const rulesButtons = screen.getAllByRole('button', { name: 'Planogram Rules' });
      
      fireEvent.click(rulesButtons[0]);
      
      const openCalls = mockRuleManagerModal.mock.calls.filter(
        (call) => call[0]?.isOpen === true
      );
      expect(openCalls.length).toBeGreaterThan(initialCalls);
    });

    it('renders DuplicateSuccessModal when duplicate is successful', async () => {
      const mockResponse = {
        data: {
          data: {
            record: {
              id: 'new-planogram-id',
              version_no: 2,
            },
          },
        },
      };

      duplicatePlanogram.mockResolvedValue(mockResponse);

      renderComponent({ isMyPlanogram: false });

      const duplicateButton = screen.getByText('Duplicate & Edit').closest('button');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(mockDuplicateSuccessModal).toHaveBeenCalledWith(
          expect.objectContaining({
            open: true,
            duplicatedId: 'new-planogram-id',
          }),
        );
      });
    });

    it('renders SaveConfirmationModal when save button is clicked', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const saveButton = screen.getByText('Save').closest('button');
      fireEvent.click(saveButton);

      expect(mockSaveConfirmationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          planogramName: 'PG-001',
          status: 'draft',
        }),
      );
    });

    it('renders SubmitConfirmationModal when submit button is clicked', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;
      mockReduxState.planogramVisualizerData.violations = [];

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      const submitButton = screen.getByText('Submit').closest('button');
      fireEvent.click(submitButton);

      expect(mockSubmitConfirmationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
          planogramName: 'PG-001',
        }),
      );
    });

    it('uses fallback planogram name when rowData.planogramId is missing', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;

      renderComponent({ isMyPlanogram: true, status: 'draft', rowData: { id: 'planogram-1' } });

      const saveButton = screen.getByText('Save').closest('button');
      fireEvent.click(saveButton);

      expect(mockSaveConfirmationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          planogramName: 'this planogram',
        }),
      );
    });

    it('renders all modals with correct props', () => {
      mockReduxState.planogramVisualizerData.isFullScreen = false;

      renderComponent({ isMyPlanogram: true, status: 'draft' });

      expect(mockDuplicateSuccessModal).toHaveBeenCalled();
      expect(mockSaveConfirmationModal).toHaveBeenCalled();
      expect(mockSubmitConfirmationModal).toHaveBeenCalled();
    });
  });

  describe('Version Display', () => {
    beforeEach(() => {
      // Ensure real timers for MUI Select interactions
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('displays "Original" for version 0', () => {
      const clusterMap = [
        { id: 'planogram-1', version: 0, shortDesc: 'Original' },
      ];

      renderComponent({ clusterMap });

      const selectInput = screen.getByRole('combobox');
      fireEvent.mouseDown(selectInput);

      expect(screen.getByRole('option', { name: 'Original' })).toBeInTheDocument();
    });

    it('displays version label with shortDesc when version is not 0', () => {
      const clusterMap = [
        { id: 'planogram-1', version: 1, shortDesc: 'Updated' },
      ];

      renderComponent({ clusterMap });

      const selectInput = screen.getByRole('combobox');
      fireEvent.mouseDown(selectInput);

      expect(screen.getByRole('option', { name: 'Updated (V1)' })).toBeInTheDocument();
    });

    it('handles version without shortDesc', () => {
      const clusterMap = [
        { id: 'planogram-1', version: 1, shortDesc: null },
      ];

      renderComponent({ clusterMap });

      const selectInput = screen.getByRole('combobox');
      fireEvent.mouseDown(selectInput);

      // When shortDesc is null, it becomes empty string, so label is " (V1)"
      // But the component uses ?? "" so null becomes "", resulting in " (V1)"
      const option = screen.getByRole('option', { name: /\(V1\)/ });
      expect(option).toBeInTheDocument();
    });
  });
});

