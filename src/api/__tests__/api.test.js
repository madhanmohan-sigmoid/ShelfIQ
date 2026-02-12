// Mock axiosInstance
jest.mock('../axiosInstance', () => {
  const mockGetFn = jest.fn();
  const mockPostFn = jest.fn();
  const mockPutFn = jest.fn();
  
  // Store references globally so tests can access them
  globalThis.mockGet = mockGetFn;
  globalThis.mockPost = mockPostFn;
  globalThis.mockPut = mockPutFn;
  
  return {
    __esModule: true,
    default: {
      get: mockGetFn,
      post: mockPostFn,
      put: mockPutFn,
      defaults: {
        baseURL: '/api/v1/'
      }
    }
  };
});

import * as api from '../api';

// Get references to the mocked functions
const mockGet = globalThis.mockGet;
const mockPost = globalThis.mockPost;
const mockPut = globalThis.mockPut;

describe('API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('getMasterData should call /data_template', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /data_template' });
      const res = await api.getMasterData();
      expect(mockGet).toHaveBeenCalledWith('/data_template');
      expect(res.data).toBe('mocked response for /data_template');
    });

    it('getAllPlanograms should call /planogram/get-all-planogram with default params', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /planogram/get-all-planogram' });
      const res = await api.getAllPlanograms();
      expect(mockGet).toHaveBeenCalledWith('/planogram/get-all-planogram', {
        params: {
          retailer_id: 1,
          limit: 100,
          offset: 0
        }
      });
      expect(res.data).toBe('mocked response for /planogram/get-all-planogram');
    });

    it('getAllPlanograms should call with custom params', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response' });
      const res = await api.getAllPlanograms(5, 50, 10);
      expect(mockGet).toHaveBeenCalledWith('/planogram/get-all-planogram', {
        params: {
          retailer_id: 5,
          limit: 50,
          offset: 10
        }
      });
      expect(res.data).toBe('mocked response');
    });

    it('getPlanogramVisualizer should call /planogram-visualizer with planogram_instance_id', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /planogram-visualizer?planogram_instance_id=123' });
      const res = await api.getPlanogramVisualizer(123);
      expect(mockGet).toHaveBeenCalledWith('/planogram-visualizer?planogram_instance_id=123');
      expect(res.data).toBe('mocked response for /planogram-visualizer?planogram_instance_id=123');
    });

    it('getProductData should call /product/product-data', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /product/product-data' });
      const res = await api.getProductData();
      expect(mockGet).toHaveBeenCalledWith('/product/product-data');
      expect(res.data).toBe('mocked response for /product/product-data');
    });

    it('getProductKPI should call /product/product-kpi with both planogram_instance_id and product_id', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /product/product-kpi' });
      const res = await api.getProductKPI(123, 456);
      expect(mockGet).toHaveBeenCalledWith('/product/product-kpi?planogram_instance_id=123&product_id=456');
      expect(res.data).toBe('mocked response for /product/product-kpi');
    });

    it('getScorecardData should call /range-review with specific ID', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for /range-review' });
      const res = await api.getScorecardData();
      expect(mockGet).toHaveBeenCalledWith('/range-review/c21c3454-f08d-4e90-aa1e-e28b1d9e07d6');
      expect(res.data).toBe('mocked response for /range-review');
    });

    it('getAttributeScoreCard should call /planogram-scorecard/attribute-scorecard with params', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for attribute-scorecard' });
      const res = await api.getAttributeScoreCard(1, 2, 'brand', 'store123');
      expect(mockGet).toHaveBeenCalledWith('/planogram-scorecard/attribute-scorecard', {
        params: {
          before_planogram_id: 1,
          after_planogram_id: 2,
          attribute_value: 'brand',
          store_ids: 'store123'
        }
      });
      expect(res.data).toBe('mocked response for attribute-scorecard');
    });

    it('getClusterData should call /planogram-scorecard/base-scorecard with params', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for base-scorecard' });
      const res = await api.getClusterData(1, 2, 'store123');
      expect(mockGet).toHaveBeenCalledWith('/planogram-scorecard/base-scorecard', {
        params: {
          before_planogram_id: 1,
          after_planogram_id: 2,
          store_ids: 'store123'
        }
      });
      expect(res.data).toBe('mocked response for base-scorecard');
    });

    it('getPlanogramProductKPIS should call /product/planogram-product-kpis with planogram_instance_id', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for planogram-product-kpis' });
      const res = await api.getPlanogramProductKPIS(123);
      expect(mockGet).toHaveBeenCalledWith('/product/planogram-product-kpis', {
        params: {
          planogram_instance_id: 123
        }
      });
      expect(res.data).toBe('mocked response for planogram-product-kpis');
    });

    it('getPlanogramAttributes should call /planogram-scorecard/planogram-attributes with planogram_id', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for planogram-attributes' });
      const res = await api.getPlanogramAttributes(456);
      expect(mockGet).toHaveBeenCalledWith('/planogram-scorecard/planogram-attributes', {
        params: {
          planogram_id: 456
        }
      });
      expect(res.data).toBe('mocked response for planogram-attributes');
    });

    it('getPlanogramRules should call /planogram-rules/get-planogram-rules/{id}', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for planogram-rules' });
      const res = await api.getPlanogramRules(789);
      expect(mockGet).toHaveBeenCalledWith('/planogram-rules/get-planogram-rules/789');
      expect(res.data).toBe('mocked response for planogram-rules');
    });

    it('getUserProfileImage should call Microsoft Graph API with arraybuffer responseType', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      mockGet.mockResolvedValue({ data: mockArrayBuffer });
      const res = await api.getUserProfileImage();
      expect(mockGet).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/me/photo/$value', {
        responseType: 'arraybuffer'
      });
      expect(res.data).toBe(mockArrayBuffer);
    });

    it('getMyPlanograms should call POST /planogram/get-my-planograms with email', async () => {
      mockPost.mockResolvedValue({ data: 'mocked response for my-planograms' });
      const res = await api.getMyPlanograms('test@example.com');
      expect(mockPost).toHaveBeenCalledWith('/planogram/get-my-planograms', { email: 'test@example.com' });
      expect(res.data).toBe('mocked response for my-planograms');
    });

    it('getRegionRetailerCategoryMappings should call /data_template/region-retailer-category-mappings', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for region-retailer-category-mappings' });
      const res = await api.getRegionRetailerCategoryMappings();
      expect(mockGet).toHaveBeenCalledWith('/data_template/region-retailer-category-mappings');
      expect(res.data).toBe('mocked response for region-retailer-category-mappings');
    });

    it('getNpdProducts should call /npd_delisted/npd-products', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for npd-products' });
      const res = await api.getNpdProducts();
      expect(mockGet).toHaveBeenCalledWith('/npd_delisted/npd-products');
      expect(res.data).toBe('mocked response for npd-products');
    });

    it('getDelistedProducts should call /npd_delisted/delisted-products', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for delisted-products' });
      const res = await api.getDelistedProducts();
      expect(mockGet).toHaveBeenCalledWith('/npd_delisted/delisted-products');
      expect(res.data).toBe('mocked response for delisted-products');
    });

    it('getOptimizationStatus should call /rules_manager/status/{jobId}', async () => {
      mockGet.mockResolvedValue({ data: 'mocked response for optimization-status' });
      const res = await api.getOptimizationStatus('job-123');
      expect(mockGet).toHaveBeenCalledWith('/rules_manager/status/job-123');
      expect(res.data).toBe('mocked response for optimization-status');
    });
  });

  describe('POST requests', () => {
    it('getProductKPIs should call POST /planogram/product-kpis-planogram with planogram_id', async () => {
      mockPost.mockResolvedValue({ data: 'mocked response for product-kpis-planogram' });
      const res = await api.getProductKPIs(123);
      expect(mockPost).toHaveBeenCalledWith('/planogram/product-kpis-planogram', {
        planogram_id: 123
      });
      expect(res.data).toBe('mocked response for product-kpis-planogram');
    });

    it('exportPlanogramSchematic should call POST /planogram-visualizer/export-planogram-schematic/{id} with blob responseType', async () => {
      const payload = { format: 'pdf' };
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockPost.mockResolvedValue({ data: mockBlob });
      const res = await api.exportPlanogramSchematic(123, payload);
      expect(mockPost).toHaveBeenCalledWith(
        '/planogram-visualizer/export-planogram-schematic/123',
        payload,
        {
          responseType: 'blob'
        }
      );
      expect(res.data).toBe(mockBlob);
    });

    it('addProduct should call POST /product/add-product with FormData and file', async () => {
      const payload = { name: 'Test Product', price: 10.99 };
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      mockPost.mockResolvedValue({ data: 'mocked response for add-product' });
      const res = await api.addProduct('retailer1', 'category1', payload, file);
      
      expect(mockPost).toHaveBeenCalledWith(
        '/product/add-product',
        expect.any(FormData),
        {
          params: {
            retailer_name: 'retailer1',
            category_name: 'category1'
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      expect(res.data).toBe('mocked response for add-product');
    });

    it('addProduct should work without file', async () => {
      const payload = { name: 'Test Product' };
      mockPost.mockResolvedValue({ data: 'mocked response for add-product' });
      const res = await api.addProduct('retailer1', 'category1', payload, null);
      
      expect(mockPost).toHaveBeenCalledWith(
        '/product/add-product',
        expect.any(FormData),
        {
          params: {
            retailer_name: 'retailer1',
            category_name: 'category1'
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      expect(res.data).toBe('mocked response for add-product');
    });

    it('checkUserAuthorization should call POST /users/user-info with email and return authorized true', async () => {
      mockPost.mockResolvedValue({ 
        data: { 
          status: true,
          user: { name: 'Test User', email: 'test@example.com' }
        } 
      });
      const res = await api.checkUserAuthorization('Test User', 'test@example.com');
      
      expect(mockPost).toHaveBeenCalledWith('/users/user-info', { email: 'test@example.com' });
      expect(res.authorized).toBe(true);
      expect(res.data.status).toBe(true);
      expect(res.data.user.email).toBe('test@example.com');
    });

    it('checkUserAuthorization should return authorized false when status is false', async () => {
      mockPost.mockResolvedValue({ 
        data: { 
          status: false,
          message: 'User not authorized'
        } 
      });
      const res = await api.checkUserAuthorization('Test User', 'test@example.com');
      
      expect(res.authorized).toBe(false);
      expect(res.data.status).toBe(false);
    });

    it('checkUserAuthorization should handle errors and return authorized false', async () => {
      const error = new Error('Network error');
      mockPost.mockRejectedValue(error);
      const res = await api.checkUserAuthorization('Test User', 'test@example.com');
      
      expect(res.authorized).toBe(false);
      expect(res.error).toBe('Network error');
    });

    it('duplicatePlanogram should call POST /planogram/clone-planogram with planogram_id', async () => {
      mockPost.mockResolvedValue({ data: 'mocked response for clone-planogram' });
      const res = await api.duplicatePlanogram(123);
      
      expect(mockPost).toHaveBeenCalledWith('/planogram/clone-planogram', {
        planogram_id: 123
      });
      expect(res.data).toBe('mocked response for clone-planogram');
    });

    it('compareTwoPlanograms should call POST /planogram/compare-two-planograms with planogram ids', async () => {
      mockPost.mockResolvedValue({ data: 'mocked response for compare-two-planograms' });
      const res = await api.compareTwoPlanograms(1, 2);

      expect(mockPost).toHaveBeenCalledWith('/planogram/compare-two-planograms', {
        planogram_id_1: 1,
        planogram_id_2: 2
      });
      expect(res.data).toBe('mocked response for compare-two-planograms');
    });

    it('saveOrPublishPlanogram should call POST /planogram/save-or-publish with payload', async () => {
      const payload = { planogram_id: 123, action: 'save', name: 'Test Planogram' };
      mockPost.mockResolvedValue({ data: 'mocked response for save-or-publish' });
      const res = await api.saveOrPublishPlanogram(payload);
      
      expect(mockPost).toHaveBeenCalledWith('/planogram/save-or-publish', payload);
      expect(res.data).toBe('mocked response for save-or-publish');
    });

    it('getScorecardDataFromDSModule should call POST /planogram/get-scorecard-data-from-ds-module with payload', async () => {
      const payload = { planogram_id: 123, mode: 'absolute' };
      mockPost.mockResolvedValue({ data: 'mocked response for scorecard-data' });
      const res = await api.getScorecardDataFromDSModule(payload);

      expect(mockPost).toHaveBeenCalledWith('/planogram/get-scorecard-data-from-ds-module', payload);
      expect(res.data).toBe('mocked response for scorecard-data');
    });

    it('getRelativeScorecardDataFromDSModule should call POST /planogram/relative-scorecard-with-ds-module with payload', async () => {
      const payload = { planogram_id: 123, mode: 'relative' };
      mockPost.mockResolvedValue({ data: 'mocked response for relative-scorecard-data' });
      const res = await api.getRelativeScorecardDataFromDSModule(payload);

      expect(mockPost).toHaveBeenCalledWith('/planogram/relative-scorecard-with-ds-module', payload);
      expect(res.data).toBe('mocked response for relative-scorecard-data');
    });

    it('runRulesManager should call POST /rules_manager/run with payload', async () => {
      const payload = { planogram_id: 123, rules: ['r1', 'r2'] };
      mockPost.mockResolvedValue({ data: 'mocked response for rules-manager-run' });
      const res = await api.runRulesManager(payload);

      expect(mockPost).toHaveBeenCalledWith('/rules_manager/run', payload);
      expect(res.data).toBe('mocked response for rules-manager-run');
    });

    it('logoutUser should call POST /users/logout and return response', async () => {
      mockPost.mockResolvedValue({ data: 'mocked response for logout' });
      const res = await api.logoutUser();
      
      expect(mockPost).toHaveBeenCalledWith('/users/logout');
      expect(res.data).toBe('mocked response for logout');
    });

    it('logoutUser should handle errors and throw', async () => {
      const error = new Error('Logout failed');
      mockPost.mockRejectedValue(error);
      
      await expect(api.logoutUser()).rejects.toThrow('Logout failed');
      expect(mockPost).toHaveBeenCalledWith('/users/logout');
    });

    it('azureLogin should redirect to Azure login URL and return URL', () => {
      const originalLocation = globalThis.location;
      const mockLocation = { href: '' };
      Object.defineProperty(globalThis, 'location', {
        value: mockLocation,
        writable: true
      });

      const loginUrl = api.azureLogin();
      expect(loginUrl).toBe('/v1//auth/azure/login');
      expect(globalThis.location.href).toBe('/v1//auth/azure/login');

      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true
      });
    });
  });

  describe('PUT requests', () => {
    it('updateProduct should call PUT /product/update-product-details with FormData and file', async () => {
      const payload = { name: 'Updated Product', price: 15.99 };
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      mockPut.mockResolvedValue({ data: 'mocked response for update-product' });
      const res = await api.updateProduct('retailer1', 'category1', 123, payload, file);
      
      expect(mockPut).toHaveBeenCalledWith(
        '/product/update-product-details',
        expect.any(FormData),
        {
          params: {
            product_id: 123,
            retailer_name: 'retailer1',
            category_name: 'category1'
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      expect(res.data).toBe('mocked response for update-product');
    });

    it('updateProduct should work without file', async () => {
      const payload = { name: 'Updated Product' };
      mockPut.mockResolvedValue({ data: 'mocked response for update-product' });
      const res = await api.updateProduct('retailer1', 'category1', 123, payload, null);
      
      expect(mockPut).toHaveBeenCalledWith(
        '/product/update-product-details',
        expect.any(FormData),
        {
          params: {
            product_id: 123,
            retailer_name: 'retailer1',
            category_name: 'category1'
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      expect(res.data).toBe('mocked response for update-product');
    });
  });

});
