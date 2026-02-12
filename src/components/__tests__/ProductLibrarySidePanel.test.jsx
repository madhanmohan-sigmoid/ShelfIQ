import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductLibrarySidePanel from '../ProductLibrarySidePanel';
import dataTemplateReducer from '../../redux/reducers/dataTemplateSlice';
import regionRetailerReducer from '../../redux/reducers/regionRetailerSlice';
import productDataReducer from '../../redux/reducers/productDataSlice';

// Mock API layer
jest.mock('../../api/api', () => ({
  addProduct: jest.fn(() => Promise.resolve({ data: { id: 'new-id' } })),
  updateProduct: jest.fn(() => Promise.resolve({ data: {} })),
  getProductData: jest.fn(() => Promise.resolve({ data: { data: [] } })),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock image asset import used in header
jest.mock('../../assets/product_box.svg', () => 'mocked-product-box.svg');

const { addProduct, updateProduct, getProductData } = require('../../api/api');
const toast = require('react-hot-toast').default;

describe('ProductLibrarySidePanel', () => {
  const defaultMasterData = {
    master_product_brands: [
      { id: 1, name: 'BrandOne' },
      { id: 2, name: 'BrandTwo' },
    ],
    master_product_sub_categories: [
      { id: 11, name: 'CategoryOne' },
      { id: 22, name: 'CategoryTwo' },
    ],
  };

  const createTestStore = (overrides = {}) => {
    return configureStore({
      reducer: {
        masterData: dataTemplateReducer,
        regionRetailer: regionRetailerReducer,
        productData: productDataReducer,
      },
      preloadedState: {
        masterData: {
          ...defaultMasterData,
          ...overrides.masterData,
        },
        regionRetailer: {
          selectedRetailer: { name: 'TESCO' },
          selectedCategory: { name: 'ORAL CARE' },
          ...overrides.regionRetailer,
        },
        productData: {
          products: [],
          ...overrides.productData,
        },
      },
    });
  };

  const baseProduct = {
    tpnb: '123456',
    name: 'Sample Product',
    brand_name: 'BrandOne',
    subCategory_name: 'CategoryOne',
    price: 1000,
    global_trade_item_number: 'GTIN123',
    image_url: '',
    width: 100,
    height: 200,
    depth: 300,
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithStore = (ui, store) => {
    return render(<Provider store={store}>{ui}</Provider>);
  };

  const fillEditableFields = (container) => {
    fireEvent.change(container.querySelector('input[name="tpnb"]'), { target: { value: '999999' } });
    fireEvent.change(container.querySelector('input[name="global_trade_item_number"]'), { target: { value: 'GTIN999' } });
    fireEvent.change(container.querySelector('input[name="product_name"]'), { target: { value: 'Updated Product' } });
    fireEvent.change(container.querySelector('input[name="price"]'), { target: { value: '2500' } });
    fireEvent.change(container.querySelector('select[name="attributes.BRAND"]'), { target: { value: 'BrandOne' } });
    fireEvent.change(container.querySelector('select[name="attributes.SUB_CATEGORY"]'), { target: { value: 'CategoryOne' } });
    fireEvent.change(container.querySelector('input[name="width"]'), { target: { value: '120' } });
    fireEvent.change(container.querySelector('input[name="height"]'), { target: { value: '220' } });
    fireEvent.change(container.querySelector('input[name="depth"]'), { target: { value: '320' } });
  };

  it('submits the form and calls addProduct for a new product', async () => {
    const store = createTestStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const onClose = jest.fn();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithStore(
      <ProductLibrarySidePanel product={emptyProduct} onClose={onClose} mode="edit" />,
      store
    );

    fillEditableFields(container);

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(addProduct).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Created new Product Successfully');
      expect(onClose).toHaveBeenCalled();
    });

    const addCallArgs = addProduct.mock.calls[0];
    expect(addCallArgs[0]).toBe('TESCO');
    expect(addCallArgs[1]).toBe('ORAL CARE');
    expect(addCallArgs[2]).toMatchObject({
      tpnb: '999999',
      price: 2500,
      attributes: {
        BRAND: 'BrandOne',
        SUB_CATEGORY: 'CategoryOne',
      },
    });

    expect(dispatchSpy.mock.calls.some(call => call[0].type === 'productData/setProducts')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('submits the form and calls updateProduct for existing product', async () => {
    const store = createTestStore();
    const onClose = jest.fn();
    const product = { ...baseProduct, id: 42 };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithStore(
      <ProductLibrarySidePanel product={product} onClose={onClose} mode="edit" />,
      store
    );

    fillEditableFields(container);

    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('Updated Successfully');
      expect(onClose).toHaveBeenCalled();
    });

    const updateArgs = updateProduct.mock.calls[0];
    expect(updateArgs[0]).toBe('TESCO');
    expect(updateArgs[1]).toBe('ORAL CARE');
    expect(updateArgs[2]).toBe(42);
    expect(updateArgs[3]).toMatchObject({ name: 'Updated Product', price: 2500 });

    consoleSpy.mockRestore();
  });

  it('shows an error toast when the update call fails', async () => {
    updateProduct.mockRejectedValueOnce(new Error('Network Error'));
    const store = createTestStore();
    const onClose = jest.fn();
    const product = { ...baseProduct, id: 7 };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { container } = renderWithStore(
      <ProductLibrarySidePanel product={product} onClose={onClose} mode="edit" />,
      store
    );

    fillEditableFields(container);
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      expect(onClose).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('resets form fields when the product prop changes', () => {
    const store = createTestStore();
    const { rerender } = renderWithStore(
      <ProductLibrarySidePanel product={{ ...baseProduct, name: 'Product A' }} onClose={jest.fn()} mode="edit" />,
      store
    );

    expect(screen.getByDisplayValue('Product A')).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <ProductLibrarySidePanel product={{ ...baseProduct, name: 'Product B', tpnb: '654321' }} onClose={jest.fn()} mode="edit" />
      </Provider>
    );

    expect(screen.getByDisplayValue('Product B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('654321')).toBeInTheDocument();
  });

  it('disables inputs when rendered in view mode', () => {
    const store = createTestStore();

    renderWithStore(
      <ProductLibrarySidePanel product={baseProduct} onClose={jest.fn()} mode="view" />,
      store
    );

    const tpnbInput = screen.getByDisplayValue(baseProduct.tpnb);
    expect(tpnbInput).toBeDisabled();
  });

  it('updates price preview when price field changes', () => {
    const store = createTestStore();

    const { container } = renderWithStore(
      <ProductLibrarySidePanel product={{ ...baseProduct, price: 1000 }} onClose={jest.fn()} mode="edit" />,
      store
    );

    const priceInput = container.querySelector('input[name="price"]');
    fireEvent.change(priceInput, { target: { value: '1234' } });

    expect(screen.getByText('£12.34')).toBeInTheDocument();
  });
});
