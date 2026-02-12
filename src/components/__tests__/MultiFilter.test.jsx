import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MultiFilter from '../MultiFilter';

// Mock ag-grid-react hook
jest.mock('ag-grid-react', () => ({
  useGridFilter: jest.fn(() => ({
    model: null,
    onModelChange: jest.fn(),
  })),
}));

describe('MultiFilter', () => {
  const mockColDef = {
    field: 'testField',
  };

  const createMockApi = (dataCallback) => {
    const runner =
      dataCallback ||
      ((callback) => {
        callback({ data: { testField: 'value1' } });
        callback({ data: { testField: 'value2' } });
        callback({ data: { testField: 'value3' } });
      });

    return {
      forEachNodeAfterFilterAndSort: jest.fn((callback) => runner(callback)),
      forEachNode: jest.fn((callback) => runner(callback)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onFilterChanged: jest.fn(),
      hidePopupMenu: jest.fn(),
      closeFilterFloatingWindow: jest.fn(),
      filterManager: { hidePopupMenu: jest.fn() },
    };
  };

  const defaultProps = {
    model: null,
    onModelChange: jest.fn(),
    colDef: mockColDef,
    api: createMockApi(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<MultiFilter {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should render checkboxes for unique values', () => {
    render(<MultiFilter {...defaultProps} />);
    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.getByText('value2')).toBeInTheDocument();
    expect(screen.getByText('value3')).toBeInTheDocument();
  });

  it('should render "Select All" checkbox', () => {
    render(<MultiFilter {...defaultProps} />);
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('should filter checkboxes based on search text', () => {
    render(<MultiFilter {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(searchInput, { target: { value: 'value1' } });
    
    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.queryByText('value2')).not.toBeInTheDocument();
  });

  it('should show "No matches found" when search has no results', () => {
    render(<MultiFilter {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search...');
    
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('should toggle individual checkbox when clicked', async () => {
    render(<MultiFilter {...defaultProps} />);
    const value1Button = screen.getByText('value1').closest('button');
    const checkboxInput = value1Button.querySelector('input[type="checkbox"]');
    expect(checkboxInput).toBeChecked();

    fireEvent.click(value1Button);

    await waitFor(() => {
      expect(checkboxInput).not.toBeChecked();
    });
  });

  it('should toggle all checkboxes when Select All is clicked (uncheck all)', async () => {
    render(<MultiFilter {...defaultProps} />);
    const selectAllButton = screen.getByText('Select All').closest('button');
    const initialCheckboxes = screen.getAllByRole('checkbox');
    for (const checkbox of initialCheckboxes) {
      expect(checkbox).toBeChecked();
    }
    
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      const updatedCheckboxes = screen.getAllByRole('checkbox');
      for (const checkbox of updatedCheckboxes) {
        expect(checkbox).not.toBeChecked();
      }
    });
  });

  it('should toggle all checkboxes when Select All is clicked (check all)', async () => {
    render(<MultiFilter {...defaultProps} />);
    
    // First uncheck one
    const value1Button = screen.getByText('value1').closest('button');
    const checkboxInput = value1Button.querySelector('input[type="checkbox"]');
    fireEvent.click(value1Button);
    
    await waitFor(() => {
      expect(checkboxInput).not.toBeChecked();
    });
    
    // Then click Select All to check all again
    const selectAllButton = screen.getByText('Select All').closest('button');
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        expect(checkbox).toBeChecked();
      }
    });
  });

  it('should call onModelChange with null when all are selected and Apply is clicked', () => {
    const onModelChange = jest.fn();
    render(<MultiFilter {...defaultProps} onModelChange={onModelChange} />);
    
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    
    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  it('should call onModelChange with selected values when some are unchecked and Apply is clicked', async () => {
    const onModelChange = jest.fn();
    render(<MultiFilter {...defaultProps} onModelChange={onModelChange} />);
    
    // Uncheck one value
    const value1Button = screen.getByText('value1').closest('button');
    fireEvent.click(value1Button);
    
    await waitFor(() => {
      const checkboxInput = value1Button.querySelector('input[type="checkbox"]');
      expect(checkboxInput).not.toBeChecked();
    });
    
    // Apply filter
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(onModelChange).toHaveBeenCalled();
      const call = onModelChange.mock.calls[0][0];
      expect(call).not.toBeNull();
      expect(Array.isArray(call)).toBe(true);
    });
  });

  it('should call onModelChange with null and reset all checkboxes when Clear is clicked', () => {
    const onModelChange = jest.fn();
    render(<MultiFilter {...defaultProps} onModelChange={onModelChange} />);
    
    // Uncheck some values
    const value1Button = screen.getByText('value1').closest('button');
    fireEvent.click(value1Button);
    
    // Click Clear
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  it('should handle api being null', () => {
    render(<MultiFilter {...defaultProps} api={null} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should handle array field values', () => {
    const apiWithArray = createMockApi((callback) => {
      callback({ data: { testField: [{ name: 'arrayValue1' }, { name: 'arrayValue2' }] } });
    });

    render(<MultiFilter {...defaultProps} api={apiWithArray} />);
    expect(screen.getByText('arrayValue1')).toBeInTheDocument();
    expect(screen.getByText('arrayValue2')).toBeInTheDocument();
  });

  it('should handle array field values with null items', () => {
    const apiWithArray = createMockApi((callback) => {
      callback({ data: { testField: [{ name: 'value1' }, null, { name: 'value2' }] } });
    });

    render(<MultiFilter {...defaultProps} api={apiWithArray} />);
    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.getByText('value2')).toBeInTheDocument();
  });

  it('should handle null and undefined values in data', () => {
    const apiWithNull = createMockApi((callback) => {
      callback({ data: { testField: null } });
      callback({ data: { testField: undefined } });
      callback({ data: { testField: 'validValue' } });
    });

    render(<MultiFilter {...defaultProps} api={apiWithNull} />);
    expect(screen.getByText('validValue')).toBeInTheDocument();
  });

  it('should show all checkboxes as checked initially when model is null', () => {
    render(<MultiFilter {...defaultProps} model={null} />);
    const selectAll = screen.getByText('Select All').closest('div').querySelector('input[type="checkbox"]');
    expect(selectAll).toBeChecked();
  });

  it('should show some checkboxes as checked when model has values', async () => {
    const model = [{ field: 'value1' }];
    render(<MultiFilter {...defaultProps} model={model} />);
    
    await waitFor(() => {
      const value1Button = screen.getByText('value1').closest('button');
      const value1Checkbox = value1Button.querySelector('input[type="checkbox"]');
      expect(value1Checkbox).toBeChecked();
    });
  });

  it('should show "Loading options..." when checkBoxArr is empty and no search', () => {
    const emptyApi = createMockApi(() => {
      // No data
    });

    render(<MultiFilter {...defaultProps} api={emptyApi} />);
    expect(screen.getByText('Loading options...')).toBeInTheDocument();
  });

  it('should disable buttons when checkBoxArr is empty', () => {
    const emptyApi = createMockApi(() => {
      // No data
    });

    render(<MultiFilter {...defaultProps} api={emptyApi} />);
    const clearButton = screen.getByText('Clear');
    const applyButton = screen.getByText('Apply');
    
    expect(clearButton).toBeDisabled();
    expect(applyButton).toBeDisabled();
  });

  it('should handle field with empty string or blank values', () => {
    const apiWithBlanks = createMockApi((callback) => {
      callback({ data: { testField: '' } });
      callback({ data: { testField: 'value1' } });
    });

    render(<MultiFilter {...defaultProps} api={apiWithBlanks} />);
    expect(screen.getByText('blank')).toBeInTheDocument();
  });
});

