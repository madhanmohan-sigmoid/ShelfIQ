import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SSOPage from '../SSOPage';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('@azure/msal-react', () => ({
  useMsal: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
  }),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../redux/reducers/authSlice', () => ({
  loginSuccess: jest.fn((payload) => ({ type: 'auth/loginSuccess', payload })),
}));

jest.mock('../../api/api', () => ({
  checkUserAuthorization: jest.fn(),
}));

jest.mock('../../config/authConfig', () => ({
  loginRequest: { scopes: ['user.read'] },
}));

const { useMsal } = jest.requireMock('@azure/msal-react');
const { useDispatch } = jest.requireMock('react-redux');
const { loginSuccess } = jest.requireMock('../../redux/reducers/authSlice');
const { checkUserAuthorization } = jest.requireMock('../../api/api');

const createMsalMock = (overrides = {}) => ({
  instance: {
    handleRedirectPromise: jest.fn().mockResolvedValue(null),
    acquireTokenSilent: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    loginRedirect: jest.fn(),
    loginPopup: jest.fn(),
    ...overrides.instance,
  },
  accounts: [],
  inProgress: 'none',
  ...overrides,
});

const renderSSOPage = (msalOverrides = {}) => {
  const msalMock = createMsalMock(msalOverrides);
  useMsal.mockReturnValue(msalMock);
  useDispatch.mockReturnValue(mockDispatch);

  render(
    <MemoryRouter>
      <SSOPage />
    </MemoryRouter>
  );

  return msalMock;
};

describe('SSOPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    checkUserAuthorization.mockResolvedValue({ authorized: 200 });
  });

  it('renders login screen with primary content', async () => {
    const msalMock = renderSSOPage();

    await waitFor(() => {
      expect(msalMock.instance.handleRedirectPromise).toHaveBeenCalled();
    });

    expect(screen.getByText('Login to ACE')).toBeInTheDocument();
    expect(screen.getByText('Welcome to ACE!')).toBeInTheDocument();
    expect(
      screen.getByText(/The easy way to organize shelves/i)
    ).toBeInTheDocument();
    expect(screen.getByText('LOGIN WITH PingID')).toBeInTheDocument();
  });

  it('initiates redirect login flow when button is clicked', async () => {
    const msalMock = renderSSOPage();

    await waitFor(() => {
      expect(msalMock.instance.handleRedirectPromise).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('LOGIN WITH PingID'));

    expect(msalMock.instance.loginRedirect).toHaveBeenCalled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('navigates to /region after silent acquisition for existing account', async () => {
    const account = { name: 'Test User', username: 'test@example.com' };

    const msalMock = renderSSOPage({
      accounts: [account],
    });

    await waitFor(() => {
      expect(msalMock.instance.acquireTokenSilent).toHaveBeenCalledWith(
        expect.objectContaining({ account })
      );
    });

    await waitFor(() => {
      expect(checkUserAuthorization).toHaveBeenCalledWith(
        account.name,
        account.username
      );
    });

    expect(loginSuccess).toHaveBeenCalledWith({
      user: { name: account.name, email: account.username },
      token: 'mock-token',
      access_groups: null,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/loginSuccess',
      payload: {
        user: { name: account.name, email: account.username },
        token: 'mock-token',
        access_groups: null,
      },
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/region', { replace: true });
    });
  });
});
