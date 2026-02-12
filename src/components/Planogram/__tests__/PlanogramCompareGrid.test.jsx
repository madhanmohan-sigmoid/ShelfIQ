import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PlanogramCompareGrid from '../PlanogramCompareGrid';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockShelfLine = jest.fn(() => <div data-testid="shelf-line" />);
jest.mock('../ShelfLine', () => (props) => mockShelfLine(props));

const mockProductNameTag = jest.fn(() => <div data-testid="product-name-tag" />);
jest.mock('../ProductNameTag', () => (props) => mockProductNameTag(props));

const DummyItem = () => <div data-testid="item-tooltip" />;

const createState = (overrides = {}) => ({
  planogramVisualizerData: {
    bays: [],
    shelfLines: [],
    ...overrides.planogramVisualizerData,
  },
});

describe('PlanogramCompareGrid', () => {
  let mockState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = createState();
    useSelector.mockImplementation((selector) => selector(mockState));
  });

  afterEach(() => {
    useSelector.mockReset();
  });

  it('renders loading state when no bays are available', () => {
    render(<PlanogramCompareGrid ItemWithTooltip={DummyItem} />);

    expect(screen.getByText('Building bays...')).toBeInTheDocument();
    expect(mockShelfLine).not.toHaveBeenCalled();
  });

  it('renders shelves and product tags when data is present', () => {
    mockState.planogramVisualizerData = {
      bays: [
        {
          width: 120,
          subShelves: [{ width: 120, height: 60 }],
        },
      ],
      shelfLines: [
        [
          [
            { id: 'prod-1' },
            { id: 'prod-2' },
          ],
        ],
      ],
    };

    render(<PlanogramCompareGrid ItemWithTooltip={DummyItem} />);

    expect(screen.queryByText('Building bays...')).not.toBeInTheDocument();
    expect(mockProductNameTag).toHaveBeenCalledTimes(1);
    expect(mockShelfLine).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockState.planogramVisualizerData.shelfLines[0][0],
        ItemWithTooltip: DummyItem,
        isViewOnly: true,
        dimmedProductIds: [],
      }),
    );
  });

  it('omits product name tags when showProductNameTag is false', () => {
    mockState.planogramVisualizerData = {
      bays: [
        {
          width: 100,
          subShelves: [{ width: 100, height: 40 }],
        },
      ],
      shelfLines: [
        [
          [
            { id: 'prod-1' },
          ],
        ],
      ],
    };

    render(
      <PlanogramCompareGrid
        ItemWithTooltip={DummyItem}
        showProductNameTag={false}
      />,
    );

    expect(mockProductNameTag).not.toHaveBeenCalled();
    expect(mockShelfLine).toHaveBeenCalledTimes(1);
  });

  it('passes dimmedProductIds and coloredProducts to ShelfLine', () => {
    const dimmedIds = ['dim-1'];
    const coloredProducts = [{ id: 'highlight-1' }];

    mockState.planogramVisualizerData = {
      bays: [
        {
          width: 140,
          subShelves: [{ width: 140, height: 55 }],
        },
      ],
      shelfLines: [
        [
          [
            { id: 'dim-1' },
          ],
        ],
      ],
    };

    render(
      <PlanogramCompareGrid
        ItemWithTooltip={DummyItem}
        dimmedProductIds={dimmedIds}
        coloredProducts={coloredProducts}
      />,
    );

    expect(mockShelfLine).toHaveBeenCalledWith(
      expect.objectContaining({
        dimmedProductIds: dimmedIds,
        coloredProducts,
      }),
    );
  });

  it('invokes onContainerReady with the scroll container when provided', async () => {
    const onContainerReady = jest.fn();
    mockState.planogramVisualizerData = {
      bays: [
        {
          width: 100,
          subShelves: [{ width: 100, height: 40 }],
        },
      ],
      shelfLines: [
        [
          [
            { id: 'prod-1' },
          ],
        ],
      ],
    };

    render(
      <PlanogramCompareGrid
        ItemWithTooltip={DummyItem}
        onContainerReady={onContainerReady}
      />,
    );

    await waitFor(() => expect(onContainerReady).toHaveBeenCalledTimes(1));
    const container = onContainerReady.mock.calls[0][0];
    expect(container).toBeInstanceOf(HTMLElement);
  });
});

