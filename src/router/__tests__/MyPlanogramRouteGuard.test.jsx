jest.mock('react-redux', () => ({
  __esModule: true,
  useSelector: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MyPlanogramRouteGuard from '../MyPlanogramRouteGuard';

describe('MyPlanogramRouteGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nested routes when categoryAccessType is not "USERS"', () => {
    useSelector.mockReturnValue('CONTRIBUTORS');

    render(
      <MemoryRouter initialEntries={['/my-planogram']}>
        <Routes>
          <Route element={<MyPlanogramRouteGuard />}>
            <Route path="/my-planogram" element={<div>My Planogram Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('My Planogram Content')).toBeInTheDocument();
  });

  it('renders nested routes when categoryAccessType is null', () => {
    useSelector.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/my-planogram']}>
        <Routes>
          <Route element={<MyPlanogramRouteGuard />}>
            <Route path="/my-planogram" element={<div>My Planogram Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('My Planogram Content')).toBeInTheDocument();
  });

  it('redirects to "/dashboard" when categoryAccessType is "USERS"', async () => {
    useSelector.mockReturnValue('USERS');

    render(
      <MemoryRouter initialEntries={['/my-planogram']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route element={<MyPlanogramRouteGuard />}>
            <Route path="/my-planogram" element={<div>My Planogram Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(screen.queryByText('My Planogram Content')).not.toBeInTheDocument();
  });

  it('calls useSelector with selectCategoryAccessType selector', () => {
    useSelector.mockReturnValue('CONTRIBUTORS');

    render(
      <MemoryRouter initialEntries={['/my-planogram']}>
        <Routes>
          <Route element={<MyPlanogramRouteGuard />}>
            <Route path="/my-planogram" element={<div>My Planogram Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(useSelector).toHaveBeenCalled();
  });
});

