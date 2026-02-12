import React from 'react';
import { render, screen } from '@testing-library/react';
import FullScreenPlanogramLoader from '../FullScreenPlanogramLoader';

jest.mock('@mui/icons-material/Construction', () => ({
  __esModule: true,
  default: () => <span data-testid="construction-icon">icon</span>,
}));

describe('FullScreenPlanogramLoader', () => {
  it('renders the full screen overlay structure', () => {
    render(<FullScreenPlanogramLoader />);

    const overlay = screen.getByTestId('fullscreen-planogram-loader');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('renders the main skeleton area with text overlay', () => {
    render(<FullScreenPlanogramLoader />);

    const skeleton = screen.getByTestId('planogram-skeleton');
    expect(skeleton).toBeInTheDocument();

    const textContainer = screen.getByText((content) =>
      content.includes("LET'S PLAN IT TOGETHER")
    );
    expect(textContainer).toBeInTheDocument();
    expect(screen.getByTestId('construction-icon')).toBeInTheDocument();
  });

  it('renders six bottom skeleton buttons', () => {
    render(<FullScreenPlanogramLoader />);

    const skeletonButtons = screen.getAllByTestId('planogram-button-skeleton');
    expect(skeletonButtons).toHaveLength(6);
  });
});


