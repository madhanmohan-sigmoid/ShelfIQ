import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MyPlanogramContainer from '../MyPlanogramContainer';

const dispatchMock = jest.fn();

jest.mock('react-redux', () => ({
  __esModule: true,
  useDispatch: jest.fn(),
}));

jest.mock('../../../redux/reducers/myPlanogramSlice', () => ({
  __esModule: true,
  resetMyPlanogram: jest.fn(() => ({ type: 'myPlanogram/reset' })),
}));

jest.mock('../../dashboard/DashboardLayout', () => {
  const DashboardLayoutMock = ({ children }) => (
    <div data-testid="dashboard-layout">{children}</div>
  );
  DashboardLayoutMock.displayName = 'DashboardLayoutMock';

  return {
    __esModule: true,
    default: DashboardLayoutMock,
  };
});

jest.mock('../MyPlanogramContent', () => {
  const MyPlanogramContentMock = () => <div data-testid="my-planogram-content" />;
  MyPlanogramContentMock.displayName = 'MyPlanogramContentMock';

  return {
    __esModule: true,
    default: MyPlanogramContentMock,
  };
});

const { useDispatch } = jest.requireMock('react-redux');
const { resetMyPlanogram } = jest.requireMock('../../../redux/reducers/myPlanogramSlice');

describe('MyPlanogramContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatchMock);
  });

  it('resets planogram state on mount', async () => {
    render(<MyPlanogramContainer />);

    await waitFor(() => {
      expect(resetMyPlanogram).toHaveBeenCalledTimes(1);
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'myPlanogram/reset' });
    });
  });

  it('renders layout and content', () => {
    render(<MyPlanogramContainer />);

    const layout = screen.getByTestId('dashboard-layout');
    const content = screen.getByTestId('my-planogram-content');

    expect(layout).toBeInTheDocument();
    expect(content).toBeInTheDocument();
  });
});

