import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

jest.mock('../../../api/api', () => ({
  getAllPlanograms: jest.fn(),
}));

import ComparePaneHeader from '../ComparePaneHeader';
import { getAllPlanograms } from '../../../api/api';

describe('ComparePaneHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while fetching versions', () => {
    const deferred = new Promise(() => {});
    getAllPlanograms.mockReturnValue(deferred);

    render(
      <ComparePaneHeader
        planogramId="planogram-1"
        onVersionChange={jest.fn()}
        otherPanePlanogramId={null}
      />,
    );

    expect(screen.getByText('Loading versions...')).toBeInTheDocument();
  });

  it('renders single version label when only one version exists', async () => {
    getAllPlanograms.mockResolvedValue({
      data: {
        data: {
          records: [
            {
              id: 'planogram-1',
              planogramId: 'PG-001',
              versionId: 0,
              clusterInfo: { id: 'cluster-1', name: 'Cluster One' },
              short_desc: 'Base',
              createdDate: '2024-01-01',
              lastModifiedDate: '2024-01-02',
              productCategoryInfo: { name: 'Category' },
              rangeReviewInfo: { name: 'Range' },
              numberOfBays: 2,
              numberOfShelves: 4,
            },
          ],
        },
      },
    });

    render(
      <ComparePaneHeader
        planogramId="planogram-1"
        onVersionChange={jest.fn()}
        otherPanePlanogramId={null}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByText('Loading versions...')).not.toBeInTheDocument(),
    );

    expect(screen.getByText('PG-001')).toBeInTheDocument();
    expect(screen.getByText('(Cluster One)')).toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('invokes onVersionChange when a different version is selected', async () => {
    const onVersionChange = jest.fn();

    getAllPlanograms.mockResolvedValue({
      data: {
        data: {
          records: [
            {
              id: 'planogram-1',
              planogramId: 'PG-001',
              versionId: 0,
              clusterInfo: { id: 'cluster-1', name: 'Cluster One' },
              short_desc: 'Base',
              createdDate: '2024-01-01',
              lastModifiedDate: '2024-01-02',
              productCategoryInfo: { name: 'Category' },
              rangeReviewInfo: { name: 'Range' },
              numberOfBays: 2,
              numberOfShelves: 4,
            },
            {
              id: 'planogram-2',
              planogramId: 'PG-002',
              versionId: 1,
              clusterInfo: { id: 'cluster-1', name: 'Cluster One' },
              short_desc: 'Updated',
              createdDate: '2024-02-01',
              lastModifiedDate: '2024-02-02',
              productCategoryInfo: { name: 'Category' },
              rangeReviewInfo: { name: 'Range' },
              numberOfBays: 3,
              numberOfShelves: 5,
            },
          ],
        },
      },
    });

    render(
      <ComparePaneHeader
        planogramId="planogram-1"
        onVersionChange={onVersionChange}
        otherPanePlanogramId={null}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByText('Loading versions...')).not.toBeInTheDocument(),
    );

    // Find the select element - try to find the native input first, fallback to combobox
    const selectInput = document.querySelector('input[value="planogram-1"]') || 
                        screen.getByRole('combobox');
    
    fireEvent.change(selectInput, { target: { value: 'planogram-2' } });

    await waitFor(() => expect(onVersionChange).toHaveBeenCalled());
    expect(onVersionChange).toHaveBeenCalledWith(
      'planogram-2',
      expect.objectContaining({
        id: 'planogram-2',
        version: 1,
        shortDesc: 'Updated',
      }),
    );
  });
});


