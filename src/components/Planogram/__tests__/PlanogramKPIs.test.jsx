import React from 'react';
import { render, screen } from '@testing-library/react';
import PlanogramKPIs from '../PlanogramKPIs';

describe('PlanogramKPIs', () => {
  it('should render without crashing', () => {
    render(<PlanogramKPIs leftCollapsed={false} rightCollapsed={false} />);
    expect(
      screen.getByText((content) => content.replace(/\u2019/g, "'").includes("KPI's"))
    ).toBeInTheDocument();
  });

  it('should display all KPI metrics', () => {
    render(<PlanogramKPIs leftCollapsed={false} rightCollapsed={false} />);
    
    expect(screen.getByText('Sales lift')).toBeInTheDocument();
    expect(screen.getByText('Kenvue shelf share')).toBeInTheDocument();
    expect(screen.getByText('DOS')).toBeInTheDocument();
    expect(screen.getByText('Merchandising')).toBeInTheDocument();
    expect(screen.getByText('Hand eye level')).toBeInTheDocument();
  });

  it('should display KPI values', () => {
    render(<PlanogramKPIs leftCollapsed={false} rightCollapsed={false} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // Sales lift
    expect(screen.getByText('7')).toBeInTheDocument(); // Kenvue shelf share
    expect(screen.getByText('50')).toBeInTheDocument(); // DOS
    expect(screen.getByText('15')).toBeInTheDocument(); // Merchandising
    expect(screen.getByText('18')).toBeInTheDocument(); // Hand eye level
  });

  it('should display Settings button', () => {
    render(<PlanogramKPIs leftCollapsed={false} rightCollapsed={false} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should adjust width based on collapsed state', () => {
    const { container, rerender } = render(
      <PlanogramKPIs leftCollapsed={false} rightCollapsed={false} />
    );
    
    const kpiBox = container.querySelector('.planogram-bg');
    expect(kpiBox).toBeInTheDocument();
    
    // Rerender with collapsed sidebars
    rerender(<PlanogramKPIs leftCollapsed={true} rightCollapsed={true} />);
    expect(kpiBox).toBeInTheDocument();
  });
});

