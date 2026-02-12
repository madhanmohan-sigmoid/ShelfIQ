import React from 'react';
import { render, screen } from '@testing-library/react';
import MyPlanogram from '../MyPlanogram';
import { renderWithProviders } from './testUtils';

// Mock the MyPlanogramContainer component
jest.mock('../../components/myPlanogram/MyPlanogramContainer', () => {
  return function MockMyPlanogramContainer() {
    return <div data-testid="my-planogram-container">MyPlanogramContainer</div>;
  };
});

describe('MyPlanogram', () => {
  it('should render without crashing', () => {
    renderWithProviders(<MyPlanogram />);
    expect(screen.getByTestId('my-planogram-container')).toBeInTheDocument();
  });

  it('should render MyPlanogramContainer component', () => {
    const { container } = renderWithProviders(<MyPlanogram />);
    expect(container).toBeTruthy();
  });
});

