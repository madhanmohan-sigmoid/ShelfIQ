jest.mock('../../utils/authHelpers', () => ({
  __esModule: true,
  isAuthenticated: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

const { isAuthenticated } = jest.requireMock('../../utils/authHelpers');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders nested routes when the user is authenticated', () => {
    isAuthenticated.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to "/" and clears auth data when the user is not authenticated', async () => {
    isAuthenticated.mockReturnValue(false);
    localStorage.setItem('accessToken', 'sample-token');
    localStorage.setItem('userAccount', JSON.stringify({ name: 'Tester' }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<div>Public Landing</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Public Landing')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('userAccount')).toBeNull();
  });
});


