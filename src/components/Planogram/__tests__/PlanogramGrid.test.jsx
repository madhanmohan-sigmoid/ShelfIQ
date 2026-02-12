import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlanogramGrid from '../PlanogramGrid';
import { useSelector, useDispatch } from 'react-redux';
import { setZoomState } from '../../../redux/reducers/planogramVisualizerSlice';

jest.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ droppableId, children }) => {
    const provided = {
      innerRef: jest.fn(),
      droppableProps: {},
      placeholder: null,
    };
    const snapshot = { isDraggingOver: false };
    return (
      <div data-testid={`droppable-${droppableId}`}>
        {children(provided, snapshot)}
      </div>
    );
  },
}));

const mockShelfLine = jest.fn((props) => (
  <div data-testid={`shelf-line-${props.shelfIdx}`} />
));
jest.mock('../ShelfLine', () => (props) => mockShelfLine(props));

const mockProductNameTag = jest.fn(() => <div data-testid="product-name-tag" />);
jest.mock('../ProductNameTag', () => (props) => mockProductNameTag(props));

jest.mock('@mui/material', () => ({
  Tooltip: ({ children }) => <>{children}</>,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

const DummyItem = () => <div data-testid="item-tooltip" />;

const createState = (overrides = {}) => ({
  planogramVisualizerData: {
    bays: [],
    shelfLines: [],
    isFullScreen: true,
    leftSidebarCollapsed: true,
    rightSidebarCollapsed: true,
    productInventorySelectedProduct: null,
    zoomState: { newValue: 1, oldValue: 1 },
    violations: [],
    pendingPlacement: {
      active: false,
      compatiblePositions: [],
    },
    ...overrides.planogramVisualizerData,
  },
});

describe('PlanogramGrid', () => {
  let mockState;
  const mockDispatch = jest.fn();
  const baseBays = [
    {
      width: 120,
      subShelves: [{ width: 120, height: 60 }],
    },
  ];
  const baseShelfLines = [
    [
      [
        { id: 'prod-1', tpnb: '123' },
      ],
    ],
  ];

  beforeAll(() => {
    Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = createState();
    useSelector.mockImplementation((selector) => selector(mockState));
    useDispatch.mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    useSelector.mockReset();
    useDispatch.mockReset();
  });

  it('renders loading state when bays are not available', () => {
    render(<PlanogramGrid ItemWithTooltip={DummyItem} zoomState={{ newValue: 1, oldValue: 1 }} />);

    expect(screen.getByText('Building bays...')).toBeInTheDocument();
    expect(mockShelfLine).not.toHaveBeenCalled();
  });

  it('renders view-only bays and triggers onBayClick when clicked', () => {
    const handleBayClick = jest.fn();
    mockState.planogramVisualizerData = {
      ...mockState.planogramVisualizerData,
      bays: baseBays,
      shelfLines: baseShelfLines,
      isFullScreen: true,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
    };

    render(
      <PlanogramGrid
        ItemWithTooltip={DummyItem}
        onBayClick={handleBayClick}
        dimmedProductIds={['prod-1']}
        zoomState={{ newValue: 1, oldValue: 1 }}
      />,
    );

    const shelfLineNode = screen.getByTestId('shelf-line-0-0');
    fireEvent.click(shelfLineNode.parentElement);

    expect(handleBayClick).toHaveBeenCalledWith(0, 0);
    expect(mockShelfLine).toHaveBeenCalledWith(
      expect.objectContaining({
        isViewOnly: true,
        dimmedProductIds: expect.arrayContaining(['prod-1']),
        displayZoom: 1,
      }),
    );
    expect(screen.queryByTestId('droppable-shelf-line-0-0')).not.toBeInTheDocument();
  });

  it('renders editable bays with Droppable containers when not in fullscreen mode', () => {
    mockState.planogramVisualizerData = {
      ...mockState.planogramVisualizerData,
      bays: baseBays,
      shelfLines: baseShelfLines,
      isFullScreen: false,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
    };

    render(<PlanogramGrid ItemWithTooltip={DummyItem} zoomState={{ newValue: 1, oldValue: 1 }} />);

    expect(screen.getByTestId('droppable-shelf-line-0-0')).toBeInTheDocument();
    expect(mockShelfLine).toHaveBeenCalledWith(
      expect.objectContaining({
        isViewOnly: false,
        displayZoom: 1,
      }),
    );
  });

  it('dispatches zoom changes on ctrl + wheel events while editing', () => {
    mockState.planogramVisualizerData = {
      ...mockState.planogramVisualizerData,
      bays: baseBays,
      shelfLines: baseShelfLines,
      isFullScreen: false,
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      zoomState: { newValue: 1, oldValue: 1 },
    };

    render(<PlanogramGrid ItemWithTooltip={DummyItem} zoomState={{ newValue: 1, oldValue: 1 }} />);

    act(() => {
      const container = document.querySelector('.planogram-bg');
      fireEvent.wheel(container, { ctrlKey: true, deltaY: -1 });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      setZoomState({ oldValue: 1, newValue: 1.1 }),
    );
  });
});

