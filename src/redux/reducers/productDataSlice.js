import { createSlice } from '@reduxjs/toolkit';
import { getProductCategoryColor } from '../../config/productCategoryColorCode';
import { flattenProduct } from '../../utils/productUtils';

const initialState = {
    products: [],
    productDetailsMap: {},
    viewMode: 'grid',
    productFilters: {
        selectedCategory: [],
        selectedBrand: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNpd: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        searchText: '',
        priceRange: {
            min: 0,
            max: Infinity,
        }
    },
    dimensionFilters: {
        width: {
            min: 0,
            max: 1000
        },
        height: {
            min: 0,
            max: 1000
        },
        depth: {
            min: 0,
            max: 1000
        },
    },
    status: "idle",
};

const productDataSlice = createSlice({
    name: 'productData',
    initialState,
    reducers: {
        setProducts: (state, action) => {
            const productList = action.payload || [];
            state.products = [];
            state.productDetailsMap = {};

            productList.forEach((product) => {
                const flatProduct = flattenProduct(product);
                const borderColor = getProductCategoryColor(flatProduct.subCategory_name);
                flatProduct.borderColor = borderColor;
                state.products.push(flatProduct);

                if (flatProduct.id) {
                    state.productDetailsMap[flatProduct.id] = flatProduct;
                }
            });
        },

        resetProducts: () => initialState,
        setViewMode: (state, action) => {
            state.viewMode = action.payload;
        },

        setSelectedCategory: (state, action) => {
            state.productFilters.selectedCategory = action.payload;
        },
        setSelectedBrand: (state, action) => {
            state.productFilters.selectedBrand = action.payload;
        },

        setSelectedBenchmark: (state, action) => {
            state.productFilters.selectedBenchmark = action.payload;
        },
        setSelectedIntensity: (state, action) => {
            state.productFilters.selectedIntensity = action.payload;
        },
        setSelectedNpd: (state, action) => {
            state.productFilters.selectedNpd = action.payload;
        },
        setSelectedPlatform: (state, action) => {
            state.productFilters.selectedPlatform = action.payload;
        },
        setSelectedPromoItem: (state, action) => {
            state.productFilters.selectedPromoItem = action.payload;
        },

        setSearchText: (state, action) => {
            state.productFilters.searchText = action.payload;
        },
        setPriceRange: (state, action) => {
            const { min, max } = action.payload;
            state.productFilters.priceRange.min = min;
            state.productFilters.priceRange.max = max;
        },
        removeFilterByValue: (state, action) => {
            const valueToRemove = action.payload;

            Object.keys(state.productFilters).forEach((key) => {
                const filter = state.productFilters[key];

                if (Array.isArray(filter)) {
                    state.productFilters[key] = filter.filter((item) => item !== valueToRemove);
                }
            });
        },

        resetFilters: (state) => {
            state.productFilters = {
                selectedCategory: [],
                selectedBrand: [],
                selectedBenchmark: [],
                selectedIntensity: [],
                selectedNpd: [],
                selectedPlatform: [],
                selectedPromoItem: [],
                searchText: '',
                priceRange: {
                    min: 0,
                    max: Infinity,
                }
            };
        },
    },
});

export const {
    setProducts,
    resetProducts,
    setViewMode,
    setPriceRange,
    setSearchText,
    setSelectedBrand,
    setSelectedCategory,
    setSelectedBenchmark,
    setSelectedIntensity,
    setSelectedNpd,
    setSelectedPlatform,
    setSelectedPromoItem,
    resetFilters,
    removeFilterByValue
} = productDataSlice.actions;

// Selectors
export const selectAllProducts = (state) => state.productData.products;
export const selectProductById = (state, id) => state.productData.productDetailsMap[id] || null;
export const selectProductMap = (state) => state.productData.productDetailsMap;
export const selectFilters = (state) => state.productData.productFilters;
export const selectViewMode = (state) => state.productData.viewMode;

export default productDataSlice.reducer;
