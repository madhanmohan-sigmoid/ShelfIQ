// Mock axiosInstance to handle import.meta.env - must be before any imports
jest.mock('../../api/axiosInstance', () => ({
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

const createMockComponent = (label) => {
  const React = require('react');
  const MockComponent = () =>
    React.createElement(
      'div',
      { 'data-testid': `${label.toLowerCase().replace(/\s+/g, '-')}-mock` },
      label
    );
  MockComponent.displayName = `${label.replace(/\s+/g, '')}Mock`;
  return MockComponent;
};

jest.mock('../../screens/Dashboard', () => ({
  __esModule: true,
  default: createMockComponent('Dashboard Page'),
}));

jest.mock('../../screens/SSOPage', () => ({
  __esModule: true,
  default: createMockComponent('SSO Page'),
}));

jest.mock('../../screens/RegionRetailerPage', () => ({
  __esModule: true,
  default: createMockComponent('Region Retailer Page'),
}));

jest.mock('../../screens/Planogram', () => ({
  __esModule: true,
  default: createMockComponent('Planogram Page'),
}));

jest.mock('../../screens/Compare', () => ({
  __esModule: true,
  default: createMockComponent('Compare Page'),
}));

jest.mock('../../screens/ProductLibrary', () => ({
  __esModule: true,
  default: createMockComponent('Product Library Page'),
}));

jest.mock('../../screens/Scorecard', () => ({
  __esModule: true,
  default: createMockComponent('Scorecard Page'),
}));

jest.mock('../../components/scorecard/ClusterOverview', () => ({
  __esModule: true,
  default: createMockComponent('Cluster Overview Page'),
}));

jest.mock('../../screens/BrandOverview', () => ({
  __esModule: true,
  default: createMockComponent('Brand Overview Page'),
}));

jest.mock('../../screens/SubcategoryOverview', () => ({
  __esModule: true,
  default: createMockComponent('Subcategory Overview Page'),
}));

jest.mock('../../screens/Analysis', () => ({
  __esModule: true,
  default: createMockComponent('Analysis Page'),
}));

jest.mock('../../screens/UserUnauthorised', () => ({
  __esModule: true,
  default: createMockComponent('User Unauthorised Page'),
}));

jest.mock('../../screens/MyPlanogram', () => ({
  __esModule: true,
  default: createMockComponent('My Planogram Page'),
}));

jest.mock('../../screens/MyPlanogramVisualizer', () => ({
  __esModule: true,
  default: createMockComponent('My Planogram Visualizer Page'),
}));

jest.mock('../../layouts/MainLayout', () => {
  const React = require('react');
  const { Outlet } = require('react-router-dom');
  const MockMainLayout = () =>
    React.createElement(
      'div',
      { 'data-testid': 'main-layout-mock' },
      React.createElement('span', null, 'Main Layout Wrapper'),
      React.createElement(Outlet, null)
    );
  MockMainLayout.displayName = 'MainLayoutMock';
  return {
    __esModule: true,
    default: MockMainLayout,
  };
});

jest.mock('../../utils/authHelpers', () => ({
  __esModule: true,
  isAuthenticated: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from '../AppRouter';

const { isAuthenticated } = jest.requireMock('../../utils/authHelpers');

describe('AppRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders SSO page for the public "/" route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('SSO Page')).toBeInTheDocument();
  });

  it('renders protected dashboard route when the user is authenticated', () => {
    isAuthenticated.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.getByTestId('main-layout-mock')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to "/" and clears auth data', async () => {
    isAuthenticated.mockReturnValue(false);
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('userAccount', JSON.stringify({ name: 'Test User' }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('SSO Page')).toBeInTheDocument();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('userAccount')).toBeNull();
  });
});


