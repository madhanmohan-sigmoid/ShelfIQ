import React from 'react';
import { render, screen } from '@testing-library/react';
import Analysis from '../Analysis';
import { renderWithProviders } from './testUtils';

describe('Analysis', () => {
  it('should render without crashing', () => {
    renderWithProviders(<Analysis />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('should display the main heading', () => {
    renderWithProviders(<Analysis />);
    const heading = screen.getByText('Coming Soon');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveStyle({ color: '#00A68C' });
  });

  it('should display the subtitle', () => {
    renderWithProviders(<Analysis />);
    expect(screen.getByText('Power BI Dashboard to be integrated')).toBeInTheDocument();
  });

  it('should display the description text', () => {
    const { container } = renderWithProviders(<Analysis />);
    const description = container.textContent;
    // Check for the description text - match key phrase without apostrophe
    expect(description.toLowerCase()).toContain("be able to explore your data with powerful visualizations");
  });

  it('should render the SVG icon', () => {
    const { container } = renderWithProviders(<Analysis />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('should have correct styling classes', () => {
    const { container } = renderWithProviders(<Analysis />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'h-screen', 'bg-white', 'text-center');
  });
});

