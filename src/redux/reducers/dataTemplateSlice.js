
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    master_countries: [],
    master_retailers: [],
    master_clusters: [],
    master_companies: [],
    master_currencies: [],
    master_product_categories: [],
    master_product_brands: [],
    master_product_sub_categories: [],
    master_product_orientations: [],
    master_products: [],
    master_stores: [],
    master_teams: [],
    master_productDetailsMap: {},
    status:"idle",
};

const masterDataSlice = createSlice({
    name: 'masterData',
    initialState,
    reducers: {
        setMasterData: (state, action) => {

            const payload = action.payload;
            console.log(payload)

            Object.keys(initialState).forEach((key) => {
                if (payload[key]?.data_list) {
                    state[key] = payload[key].data_list;
                }
            });

            const products = payload.master_products?.data_list || [];
            state.master_productDetailsMap = {};
            products.forEach((product) => {
                const {
                    id,
                    company_id,
                    category_id,
                    product_brand_id,
                    product_sub_group_id,
                    orientation_id
                } = product;

                if (!id) return;

                // Helper to get name from master list
                const getName = (list, matchId) =>
                    list.find((entry) => entry.id === matchId)?.name || '';

                const enrichedProduct = {
                    ...product,
                    name: product.product_name || product.name || '',
                    company_name: getName(payload.master_companies?.data_list || [], company_id),
                    category_name: getName(payload.master_product_categories?.data_list || [], category_id),
                    brand_name: getName(payload.master_product_brands?.data_list || [], product_brand_id),
                    subCategory_name: getName(payload.master_product_sub_groups?.data_list || [], product_sub_group_id),
                    orientation_name: getName(payload.master_product_orientations?.data_list || [], orientation_id),
                };

                state.master_productDetailsMap[id] = enrichedProduct;
            });

        },

        resetMasterData: () => initialState,
    },
});

export const { setMasterData, resetMasterData } = masterDataSlice.actions;
export const selectMasterCountries = (state) => state.masterData.master_countries;
export const selectMasterAccounts = (state) => state.masterData.master_retailers;
export const selectMasterClusters = (state) => state.masterData.master_clusters;
export const selectMasterCompanies = (state) => state.masterData.master_companies;
export const selectMasterCurrencies = (state) => state.masterData.master_currencies;
export const selectMasterProductCategories = (state) => state.masterData.master_product_categories;
export const selectMasterProductBrands = (state) => state.masterData.master_product_brands;
export const selectMasterProductSubCategories = (state) => state.masterData.master_product_sub_categories;
export const selectMasterProductOrientations = (state) => state.masterData.master_product_orientations;
export const selectMasterProducts = (state) => state.masterData.master_products;
export const selectMasterStores = (state) => state.masterData.master_stores;
export const selectMasterTeams = (state) => state.masterData.master_teams;
export const selectMasterProductsMap = (state) => state.masterData.master_productDetailsMap;


export default masterDataSlice.reducer;
