import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { renderWithProviders } from './testUtils';

// Mock the MainContainer component
jest.mock('../../components/dashboard/MainContainer', () => {
  return function MockMainContainer() {
    return <div data-testid="main-container">MainContainer</div>;
  };
});

describe('Dashboard', () => {
  it('should render without crashing', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByTestId('main-container')).toBeInTheDocument();
  });

  it('should render MainContainer component', () => {
    const { container } = renderWithProviders(<Dashboard />);
    expect(container).toBeTruthy();
  });
});

