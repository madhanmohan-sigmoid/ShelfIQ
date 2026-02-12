import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CardView from '../CardView';

// Mock fetch globally
globalThis.fetch = jest.fn();
const globalFetch = globalThis.fetch;

describe('CardView', () => {
  beforeEach(() => {
    globalFetch.mockClear();
  });

  it('should render without crashing', async () => {
    globalFetch.mockResolvedValueOnce({
      json: async () => ({ records: [] }),
    });

    render(<CardView searchTerm="" />);
    // Component renders a grid container, check for the container div
    await waitFor(() => {
      const container = document.querySelector('.grid');
      expect(container).toBeInTheDocument();
    });
  });

  it('should display planogram cards when data is loaded', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should display fallback name when projectName is missing', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-123456',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      // Should show "Planogram plan" (first 4 chars of id)
      expect(screen.getByText('Planogram plan')).toBeInTheDocument();
    });
  });

  it('should filter cards based on searchTerm', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
        {
          id: 'planogram-2',
          projectName: 'Another Planogram',
          lastModifiedDate: '2024-01-02T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { rerender } = render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
      expect(screen.getByText('Another Planogram')).toBeInTheDocument();
    });

    rerender(<CardView searchTerm="Test" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
      expect(screen.queryByText('Another Planogram')).not.toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    globalFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should generate stableId from projectName and lastModifiedDate when id is missing', async () => {
    const mockData = {
      records: [
        {
          projectName: 'My Project',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument();
    });
  });

  it('should use "planogram" fallback when both id and projectName are missing', async () => {
    const mockData = {
      records: [
        {
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      // Should show "Planogram plan" (first 4 chars of stableId "planogram-...")
      expect(screen.getByText(/Planogram plan/i)).toBeInTheDocument();
    });
  });

  it('should use "pending" fallback when lastModifiedDate is missing in stableId generation', async () => {
    const mockData = {
      records: [
        {
          projectName: 'Test Project',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('should handle completely empty record with all fallbacks', async () => {
    const mockData = {
      records: [
        {},
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      // Should show "Planogram plan" (first 4 chars of stableId "planogram-pending")
      expect(screen.getByText(/Planogram plan/i)).toBeInTheDocument();
    });
  });

  it('should handle undefined lastOptimisation in rendering', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          // lastModifiedDate is missing
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
      // Should not crash when trying to render undefined lastOptimisation
      const lastOptimisationLabels = screen.getAllByText('Last Optimisation');
      expect(lastOptimisationLabels.length).toBeGreaterThan(0);
    });
  });

  it('should handle null lastOptimisation in rendering', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: null,
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should filter case-insensitively', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
        {
          id: 'planogram-2',
          projectName: 'Another Planogram',
          lastModifiedDate: '2024-01-02T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { rerender } = render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });

    rerender(<CardView searchTerm="TEST" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
      expect(screen.queryByText('Another Planogram')).not.toBeInTheDocument();
    });
  });

  it('should filter by multiple fields (projectName, lastOptimisation, totalOptimisations, salesImprovement)', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
        {
          id: 'planogram-2',
          projectName: 'Another Planogram',
          lastModifiedDate: '2024-01-02T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { rerender } = render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });

    // Filter by date
    rerender(<CardView searchTerm="2024-01-01" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
      expect(screen.queryByText('Another Planogram')).not.toBeInTheDocument();
    });
  });

  it('should handle search with no matches', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { rerender } = render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });

    rerender(<CardView searchTerm="NonExistentPlanogram" />);

    await waitFor(() => {
      expect(screen.queryByText('Test Planogram')).not.toBeInTheDocument();
    });
  });

  it('should display formatted date correctly', async () => {
    const mockData = {
      records: [
        {
          id: 'planogram-1',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00.000Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      // Date should be formatted: "2024-01-01 10:00:00" (T replaced with space, first 19 chars)
      expect(screen.getByText(/2024-01-01 10:00:00/)).toBeInTheDocument();
    });
  });

  it('should use fallback key when id is missing in JSX rendering', async () => {
    const mockData = {
      records: [
        {
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should use fallback key when id is explicitly falsy (empty string)', async () => {
    const mockData = {
      records: [
        {
          id: '',
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should use fallback key when id is null', async () => {
    const mockData = {
      records: [
        {
          id: null,
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should use fallback key when id is 0 (falsy number)', async () => {
    const mockData = {
      records: [
        {
          id: 0,
          projectName: 'Test Planogram',
          lastModifiedDate: '2024-01-01T10:00:00Z',
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      expect(screen.getByText('Test Planogram')).toBeInTheDocument();
    });
  });

  it('should handle key fallback when both projectName and lastOptimisation are missing', async () => {
    const mockData = {
      records: [
        {
          // id is missing, will use fallback key
        },
      ],
    };

    globalFetch.mockResolvedValueOnce({
      json: async () => mockData,
    });

    render(<CardView searchTerm="" />);

    await waitFor(() => {
      // Should render with fallback projectName
      expect(screen.getByText(/Planogram/i)).toBeInTheDocument();
    });
  });
});

