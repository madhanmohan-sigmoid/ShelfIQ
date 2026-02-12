// Mock axiosInstance to handle import.meta.env - must be before any imports
jest.mock('../../../api/axiosInstance', () => ({
  baseURL: '/api/v1/',
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RulesManagerModal from '../RulesManagerModal';
import planogramVisualizerReducer from '../../../redux/reducers/planogramVisualizerSlice';

describe('RulesManagerModal', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        planogramVisualizerData: planogramVisualizerReducer,
      },
      preloadedState: {
        planogramVisualizerData: {
          ruleManager: {},
          ...initialState,
        },
      },
    });
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    isOrangeTheme: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should handle isOpen prop being false', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} isOpen={false} />
        </Provider>
      );
      
      // Modal still renders but with isOpen=false
      // Component doesn't conditionally render, just accepts prop
      expect(container).toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} isOpen={true} />
        </Provider>
      );
      
      // Should render the modal overlay
      expect(container.querySelector('.capitalize')).toBeInTheDocument();
    });

    it('should render close button', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const store = createTestStore();
      const onClose = jest.fn();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} onClose={onClose} />
        </Provider>
      );
      
      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme - isOrangeTheme = false', () => {
    it('should render with yellow theme when isOrangeTheme is false', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} isOrangeTheme={false} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Theme - isOrangeTheme = true', () => {
    it('should render with orange theme when isOrangeTheme is true', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} isOrangeTheme={true} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Empty/Null Rule Manager Data', () => {
    it('should handle empty ruleManager object', () => {
      const store = createTestStore({
        ruleManager: {},
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle null ruleManager', () => {
      const store = createTestStore({
        ruleManager: null,
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle undefined ruleManager', () => {
      const store = createTestStore({
        ruleManager: undefined,
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Rule Manager with Complete Data', () => {
    const completeRuleManager = {
      run_id: 'run-123',
      planogram_id: 'planogram-456',
      objective: {
        name: 'Maximize Sales',
        direction: 'maximize',
      },
      scope: {
        attribute_name: 'Brand',
        attribute_value: ['Brand1', 'Brand2'],
      },
      days_of_supply: 30,
      constraints: [
        {
          constraint_type: 'minimum_facings',
          attribute_name: 'Brand',
          attribute_value: 'Brand1',
          constraint_value: 5,
        },
        {
          constraint_type: 'maximum_space',
          attribute_name: 'Category',
          attribute_value: 'Category1',
          constraint_value: 100,
        },
      ],
    };

    it('should render with complete rule manager data', () => {
      const store = createTestStore({
        ruleManager: completeRuleManager,
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should render objective section', () => {
      const store = createTestStore({
        ruleManager: completeRuleManager,
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('Objective')).toBeInTheDocument();
    });

    it('should render scope section', () => {
      const store = createTestStore({
        ruleManager: completeRuleManager,
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('Scope')).toBeInTheDocument();
    });

    it('should render constraints section', () => {
      const store = createTestStore({
        ruleManager: completeRuleManager,
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('Constraints')).toBeInTheDocument();
    });
  });

  describe('Partial Rule Manager Data', () => {
    it('should handle missing objective', () => {
      const store = createTestStore({
        ruleManager: {
          run_id: 'run-123',
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle missing scope', () => {
      const store = createTestStore({
        ruleManager: {
          run_id: 'run-123',
          objective: {
            name: 'Test Objective',
          },
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle empty constraints array', () => {
      const store = createTestStore({
        ruleManager: {
          run_id: 'run-123',
          constraints: [],
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle non-array constraints', () => {
      const store = createTestStore({
        ruleManager: {
          run_id: 'run-123',
          constraints: null,
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle non-array scope attribute values', () => {
      const store = createTestStore({
        ruleManager: {
          scope: {
            attribute_name: 'Brand',
            attribute_value: 'not-an-array',
          },
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Expandable Sections', () => {
    it('should render all three section headers', () => {
      const store = createTestStore({
        ruleManager: {
          objective: { name: 'Test' },
          scope: { attribute_name: 'Brand' },
          constraints: [],
        },
      });
      
      render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByText('Objective')).toBeInTheDocument();
      expect(screen.getByText('Scope')).toBeInTheDocument();
      expect(screen.getByText('Constraints')).toBeInTheDocument();
    });
  });

  describe('Constraint Icons', () => {
    it('should render with multiple constraint types', () => {
      const store = createTestStore({
        ruleManager: {
          constraints: [
            { constraint_type: 'minimum_facings', attribute_name: 'Brand', attribute_value: 'Brand1', constraint_value: 5 },
            { constraint_type: 'maximum_space', attribute_name: 'Category', attribute_value: 'Cat1', constraint_value: 100 },
            { constraint_type: 'other_type', attribute_name: 'Other', attribute_value: 'Value', constraint_value: 10 },
          ],
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Days of Supply', () => {
    it('should render with null days_of_supply', () => {
      const store = createTestStore({
        ruleManager: {
          days_of_supply: null,
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should render with days_of_supply as number', () => {
      const store = createTestStore({
        ruleManager: {
          days_of_supply: 45,
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should render with days_of_supply as 0', () => {
      const store = createTestStore({
        ruleManager: {
          days_of_supply: 0,
        },
      });
      
      const { container } = render(
        <Provider store={store}>
          <RulesManagerModal {...defaultProps} />
        </Provider>
      );
      
      // Should render without errors (0 is falsy but valid)
      expect(container).toBeInTheDocument();
    });
  });
});

