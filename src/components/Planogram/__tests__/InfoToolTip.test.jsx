import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoTooltip from '../InfoToolTip';

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const BoxMock = ({ children, ...rest }) => (
    <div {...rest}>{children}</div>
  );
  return {
    ...actual,
    Box: BoxMock,
  };
});

jest.mock('../../assets/PlanogramInfo.svg', () => 'planogram-info.svg');

describe('InfoTooltip', () => {
  it('returns null when no data is provided', () => {
    const { container } = render(<InfoTooltip data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows tooltip content with formatted dates on hover', () => {
    const data = {
      planogramId: 'PL-1234',
      category: 'Snacks',
      clusterName: 'Cluster 7',
      rangeReviewName: 'Winter Review',
      bays: 4,
      shelvesCount: 12,
      version: 'v2',
      dateCreated: '2024-02-01T12:30:00Z',
      dateModified: '2024-03-10T08:15:00Z',
    };

    const { container } = render(<InfoTooltip data={data} />);

    fireEvent.mouseEnter(container.firstChild);

    expect(screen.getByText('PL-1234')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();

    expect(screen.getByText('Date Created')).toBeInTheDocument();
    expect(screen.getByText('01/02/2024')).toBeInTheDocument();
    expect(screen.getByText('Date Last Modified')).toBeInTheDocument();
    expect(screen.getByText('10/03/2024')).toBeInTheDocument();

    fireEvent.mouseLeave(container.firstChild);
    expect(screen.queryByText('PL-1234')).not.toBeInTheDocument();
  });
});

