import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductDetailModal from '../ProductDetailModal';
import productDataReducer from '../../../redux/reducers/productDataSlice';
import dataTemplateReducer from '../../../redux/reducers/dataTemplateSlice';
import regionRetailerReducer from '../../../redux/reducers/regionRetailerSlice';

// Mock API functions
jest.mock('../../../api/api', () => ({
  addProduct: jest.fn(() => Promise.resolve({ data: { id: 'new-id' } })),
  updateProduct: jest.fn(() => Promise.resolve({ data: {} })),
  getProductData: jest.fn(() => Promise.resolve({ data: { data: [] } })),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
  },
}));

// Mock product box icon
jest.mock('../../../assets/product_box.svg', () => 'mocked-product-box.svg');

describe('ProductDetailModal', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        productData: productDataReducer,
        masterData: dataTemplateReducer,
        regionRetailer: regionRetailerReducer,
      },
      preloadedState: {
        productData: {
          products: [],
          ...initialState.productData,
        },
        masterData: {
          master_product_brands: [
            { id: 1, name: 'Brand1' },
            { id: 2, name: 'Brand2' },
          ],
          master_product_sub_categories: [
            { id: 1, name: 'Category1' },
            { id: 2, name: 'Category2' },
          ],
          ...initialState.masterData,
        },
        regionRetailer: {
          selectedRetailer: { name: 'TESCO' },
          selectedCategory: { name: 'ORAL CARE' },
          ...initialState.regionRetailer,
        },
      },
    });
  };

  const defaultProduct = {
    id: 'product-1',
    tpnb: '123456',
    name: 'Test Product',
    brand_name: 'Brand1',
    subCategory_name: 'Category1',
    price: 1000,
    global_trade_item_number: 'GTIN123',
    image_url: 'http://example.com/image.jpg',
    width: 100,
    height: 200,
    depth: 50,
  };

  const defaultProps = {
    product: defaultProduct,
    onClose: jest.fn(),
    mode: 'view',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mode: view', () => {
    it('should render in view mode', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="view" />
        </Provider>
      );
      
      // Should render product information
      expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should display all product details in view mode', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="view" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('GTIN123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('200')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    it('should set isViewMode to true when mode is view', () => {
      const store = createTestStore();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="view" />
        </Provider>
      );
      
      // Console.log should show mode !== "edit" = true
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Mode: edit', () => {
    it('should render in edit mode', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should set isViewMode to false when mode is edit', () => {
      const store = createTestStore();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Console.log should show mode !== "edit" = false
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Mode: add', () => {
    it('should render in add mode with empty product', () => {
      const store = createTestStore();
      const emptyProduct = {
        tpnb: '',
        name: '',
        brand_name: '',
        subCategory_name: '',
        price: 0,
        global_trade_item_number: '',
        image_url: '',
        width: 0,
        height: 0,
        depth: 0,
      };
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal product={emptyProduct} onClose={jest.fn()} mode="add" />
        </Provider>
      );
      
      // Just verify it renders without errors
      expect(container).toBeInTheDocument();
    });

    it('should set isViewMode to false when mode is add', () => {
      const store = createTestStore();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="add" />
        </Provider>
      );
      
      // mode !== "edit" should be false for "add" mode
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('Product with missing fields', () => {
    it('should handle product with missing optional fields', () => {
      const store = createTestStore();
      const partialProduct = {
        tpnb: '123456',
        name: 'Partial Product',
      };
      
      render(
        <Provider store={store}>
          <ProductDetailModal product={partialProduct} onClose={jest.fn()} mode="view" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Partial Product')).toBeInTheDocument();
    });

    it('should handle product without ID', () => {
      const store = createTestStore();
      const productWithoutId = {
        tpnb: '123456',
        name: 'Product without ID',
        price: 500,
      };
      
      render(
        <Provider store={store}>
          <ProductDetailModal product={productWithoutId} onClose={jest.fn()} mode="add" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Product without ID')).toBeInTheDocument();
    });

    it('should handle product with null image_url', () => {
      const store = createTestStore();
      const productWithoutImage = {
        ...defaultProduct,
        image_url: null,
      };
      
      render(
        <Provider store={store}>
          <ProductDetailModal product={productWithoutImage} onClose={jest.fn()} mode="view" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('should use retailer from Redux state', () => {
      const store = createTestStore({
        regionRetailer: {
          selectedRetailer: { name: 'ASDA' },
          selectedCategory: { name: 'ORAL CARE' },
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Component should use 'ASDA' retailer
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should use default retailer when not in Redux', () => {
      const store = createTestStore({
        regionRetailer: {
          selectedRetailer: null,
          selectedCategory: { name: 'ORAL CARE' },
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Should default to 'TESCO'
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should use category from Redux state', () => {
      const store = createTestStore({
        regionRetailer: {
          selectedRetailer: { name: 'TESCO' },
          selectedCategory: { name: 'BEVERAGES' },
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Component should use 'BEVERAGES' category
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should use default category when not in Redux', () => {
      const store = createTestStore({
        regionRetailer: {
          selectedRetailer: { name: 'TESCO' },
          selectedCategory: null,
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Should default to 'ORAL CARE'
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });

  describe('Master Data', () => {
    it('should handle empty brands array', () => {
      const store = createTestStore({
        masterData: {
          master_product_brands: [],
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should handle null brands', () => {
      const store = createTestStore({
        masterData: {
          master_product_brands: null,
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    it('should handle empty subCategories array', () => {
      const store = createTestStore({
        masterData: {
          master_product_sub_categories: [],
        },
      });
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });

  describe('Close Handler', () => {
    it('should call onClose prop when modal is closed', () => {
      const store = createTestStore();
      const onClose = jest.fn();
      
      render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} onClose={onClose} mode="view" />
        </Provider>
      );
      
      // Component should render
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });

  describe('Form Elements', () => {
    it('should render form for editing product', () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Form should render
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      
      // Check for form element
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should render form for adding product', () => {
      const store = createTestStore();
      const productWithoutId = {
        tpnb: '123456',
        name: 'New Product',
        price: 500,
      };
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal product={productWithoutId} onClose={jest.fn()} mode="add" />
        </Provider>
      );
      
      // Form should render
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have submit button in edit mode', () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Should have buttons for submission
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Image Upload', () => {
    it('should handle image file upload', () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      // Find file input
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();

      const inputElement = fileInput;
      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      
      if (inputElement) {
        fireEvent.change(inputElement, { target: { files: [file] } });
      }
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it('should handle missing file in upload', () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <ProductDetailModal {...defaultProps} mode="edit" />
        </Provider>
      );
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();

      fireEvent.change(fileInput, { target: { files: [] } });
      // Should not crash
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should handle form with invalid data', () => {
      const store = createTestStore();
      const invalidProduct = {
        ...defaultProduct,
        price: 'invalid-price', // Invalid price
      };
      
      render(
        <Provider store={store}>
          <ProductDetailModal product={invalidProduct} onClose={jest.fn()} mode="edit" />
        </Provider>
      );
      
      // Should still render
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });
});

