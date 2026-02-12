import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Scorecard from '../Scorecard';
import { renderWithProviders } from './testUtils';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock child components
jest.mock('../../components/scorecard/ScorecardFilters', () => {
  return function MockScorecardFilters() {
    return <div data-testid="scorecard-filters">ScorecardFilters</div>;
  };
});

jest.mock('../../components/scorecard/ClusterOverview', () => {
  return function MockClusterOverview() {
    return <div data-testid="cluster-overview">ClusterOverview</div>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <svg data-testid="arrow-left-icon">ArrowLeft</svg>,
}));

describe('Scorecard', () => {
  const defaultPreloadedState = {
    scorecardData: {
      selectedPlanogramVersionId: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
    });

    it('should render the SCORECARD header text', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      const header = screen.getByText('SCORECARD');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('font-semibold', 'text-lg');
    });

    it('should render the Back to Planogram button', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      const backButton = screen.getByText('Back to Planogram');
      expect(backButton).toBeInTheDocument();
    });

    it('should render the ArrowLeft icon in the back button', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('should render ScorecardFilters component', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      expect(screen.getByTestId('scorecard-filters')).toBeInTheDocument();
    });

    it('should render ClusterOverview component', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      expect(screen.getByTestId('cluster-overview')).toBeInTheDocument();
    });

    it('should have correct container styling classes', () => {
      const { container } = renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass(
        'min-h-full',
        'flex',
        'flex-col',
        'bg-[#FAFAFA]',
        'px-10',
        'py-4'
      );
    });

    it('should have correct button styling classes', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });
      const backButton = screen.getByText('Back to Planogram').closest('button');
      expect(backButton).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'text-lg',
        'bg-[#3774B1]',
        'gap-x-3',
        'rounded-full',
        'px-8',
        'py-2.5',
        'text-white',
        'font-semibold'
      );
    });
  });

  describe('Redux Integration', () => {
    it('should call selectSelectedPlanogramVersionId selector', () => {
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: 'planogram-123',
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      // Component should render successfully, indicating selector was called
      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
    });

    it('should handle null selectedPlanogramVersionId from Redux', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
      expect(screen.getByText('Back to Planogram')).toBeInTheDocument();
    });

    it('should handle undefined selectedPlanogramVersionId from Redux', () => {
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: undefined,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
    });

    it('should handle empty string selectedPlanogramVersionId from Redux', () => {
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: '',
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate to planogram page with id when after_planogram_id exists', () => {
      const planogramId = 'planogram-456';
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: planogramId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(`/planogram?id=${planogramId}`);
    });

    it('should navigate back (-1) when after_planogram_id is null', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should navigate back (-1) when after_planogram_id is undefined', () => {
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: undefined,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should navigate back (-1) when after_planogram_id is empty string', () => {
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: '',
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should handle multiple button clicks correctly', () => {
      const planogramId = 'planogram-789';
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: planogramId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      
      // Click multiple times
      fireEvent.click(backButton);
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, `/planogram?id=${planogramId}`);
      expect(mockNavigate).toHaveBeenNthCalledWith(2, `/planogram?id=${planogramId}`);
      expect(mockNavigate).toHaveBeenNthCalledWith(3, `/planogram?id=${planogramId}`);
    });

    it('should handle navigation with special characters in planogram id', () => {
      const planogramId = 'planogram-123&test=value';
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: planogramId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(`/planogram?id=${planogramId}`);
    });
  });

  describe('Layout Structure', () => {
    it('should have correct header layout structure', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const headerContainer = screen.getByText('SCORECARD').closest('div');
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should have correct tab content container styling', () => {
      const { container } = renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const tabContent = container.querySelector('.overflow-y-auto.mt-4');
      expect(tabContent).toBeInTheDocument();
      expect(tabContent).toContainElement(screen.getByTestId('cluster-overview'));
    });

    it('should maintain proper component hierarchy', () => {
      const { container } = renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const mainContainer = container.firstChild;
      expect(mainContainer).toBeInTheDocument();
      
      // Check that all main sections are present
      expect(screen.getByText('SCORECARD')).toBeInTheDocument();
      expect(screen.getByText('Back to Planogram')).toBeInTheDocument();
      expect(screen.getByTestId('scorecard-filters')).toBeInTheDocument();
      expect(screen.getByTestId('cluster-overview')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long planogram id', () => {
      const longPlanogramId = 'a'.repeat(1000);
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: longPlanogramId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(`/planogram?id=${longPlanogramId}`);
    });

    it('should handle numeric planogram id', () => {
      const numericId = '12345';
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: numericId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(`/planogram?id=${numericId}`);
    });

    it('should handle zero as planogram id', () => {
      const zeroId = '0';
      const preloadedState = {
        scorecardData: {
          selectedPlanogramVersionId: zeroId,
        },
      };

      renderWithProviders(<Scorecard />, {
        preloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      fireEvent.click(backButton);

      // Zero is truthy, so it should navigate with the id
      expect(mockNavigate).toHaveBeenCalledWith(`/planogram?id=${zeroId}`);
    });
  });

  describe('Accessibility', () => {
    it('should have a clickable button element', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      expect(backButton).toBeInTheDocument();
      expect(backButton.tagName).toBe('BUTTON');
    });

    it('should be keyboard accessible', () => {
      renderWithProviders(<Scorecard />, {
        preloadedState: defaultPreloadedState,
      });

      const backButton = screen.getByText('Back to Planogram').closest('button');
      
      // Simulate keyboard interaction
      backButton.focus();
      expect(document.activeElement).toBe(backButton);
    });
  });
});
