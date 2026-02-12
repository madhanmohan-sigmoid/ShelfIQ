import React from 'react';
import { render, screen } from '@testing-library/react';
import KPIReport from '../KPIReport';

describe('KPIReport', () => {
  it('renders default heading and shows skeleton when no comparison data is provided', () => {
    const { container } = render(<KPIReport />);

    expect(screen.getByText('PLANOGRAM REPORT')).toBeInTheDocument();

    // When comparisonData is null, skeleton should show
    const skeletons = container.querySelectorAll('[class*="MuiSkeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('uses comparison data when provided and formats values as expected', () => {
    const comparisonData = {
      totalNoOfBrands: 20,
      totalNoOfSubCategories: 12,
      totalItems: 95,
      totalPromoItems: 30,
      totalSales: 800,
      totalUnitsSold: 470,
      averageDaysOfSupply: 28,
      kenvueTotalShelfSpace: '25%',
    };

    render(<KPIReport heading="Custom Report" comparisonData={comparisonData} />);

    expect(screen.getByText('Custom Report')).toBeInTheDocument();

    const totalBrandsInfo = screen.getByText('Total no. of Brands').parentElement;
    expect(totalBrandsInfo).not.toBeNull();
    const totalBrandsValue = totalBrandsInfo?.lastElementChild;
    expect(totalBrandsValue).toHaveTextContent('20');

    const totalSalesInfo = screen.getByText('Total sales').parentElement;
    expect(totalSalesInfo).not.toBeNull();
    const totalSalesValue = totalSalesInfo?.lastElementChild;
    expect(totalSalesValue).toHaveTextContent('800 pounds');

    const uniqueItemsInfo = screen.getByText('Unique Items').parentElement;
    expect(uniqueItemsInfo).not.toBeNull();
    const uniqueItemsValue = uniqueItemsInfo?.lastElementChild;
    // uniqueItems is not in comparisonData, so it should show N/A
    expect(uniqueItemsValue).toHaveTextContent('N/A');
  });

  it('shows skeleton loaders when loading is true', () => {
    const { container } = render(<KPIReport loading={true} />);

    expect(screen.getByText('PLANOGRAM REPORT')).toBeInTheDocument();

    // Check for skeleton elements (Material-UI Skeleton components)
    const skeletons = container.querySelectorAll('[class*="MuiSkeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows skeleton loaders when comparisonData is null and loading is false', () => {
    const { container } = render(<KPIReport comparisonData={null} loading={false} />);

    expect(screen.getByText('PLANOGRAM REPORT')).toBeInTheDocument();

    // When comparisonData is null, skeleton should show even if loading is false
    const skeletons = container.querySelectorAll('[class*="MuiSkeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows N/A for missing fields when data is loaded but field is missing', () => {
    const comparisonData = {
      totalNoOfBrands: 20,
      // totalItems is missing
    };

    render(<KPIReport comparisonData={comparisonData} loading={false} />);

    const totalBrandsInfo = screen.getByText('Total no. of Brands').parentElement;
    const totalBrandsValue = totalBrandsInfo?.lastElementChild;
    expect(totalBrandsValue).toHaveTextContent('20');

    const totalItemsInfo = screen.getByText('Total Items').parentElement;
    const totalItemsValue = totalItemsInfo?.lastElementChild;
    expect(totalItemsValue).toHaveTextContent('N/A');
  });
});


