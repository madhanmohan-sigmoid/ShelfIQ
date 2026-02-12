import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserUnauthorised from '../UserUnauthorised';
import { renderWithProviders } from './testUtils';
import { azureLogin } from '../../api/api';
import { persistor } from '../../redux/store';

// Mock dependencies - MUST be before importing the component
jest.mock('../../api/api', () => ({
  azureLogin: jest.fn(),
}));

jest.mock('../../redux/store', () => ({
  persistor: {
    purge: jest.fn(() => Promise.resolve()),
  },
}));

// Mock useMsal - note: this is used but not imported in the actual file
jest.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      logoutRedirect: jest.fn(),
    },
  }),
}));

jest.mock('../../components/auth/AuthPageLayout', () => {
  return function MockAuthPageLayout({ children }) {
    return <div data-testid="auth-page-layout">{children}</div>;
  };
});

jest.mock('../../components/auth/AuthCard', () => {
  return function MockAuthCard({ title, subtitle, description, buttonText, onButtonClick }) {
    return (
      <div data-testid="auth-card">
        <h1>{title}</h1>
        {subtitle && <h2>{subtitle}</h2>}
        <div>{description}</div>
        <button onClick={onButtonClick}>{buttonText}</button>
      </div>
    );
  };
});

describe('UserUnauthorised', () => {
  beforeEach(() => {
    azureLogin.mockClear();
    persistor.purge.mockClear();
  });

  it('should render without crashing', () => {
    renderWithProviders(<UserUnauthorised />);
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('should display the title', () => {
    renderWithProviders(<UserUnauthorised />);
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('should display the description', () => {
    renderWithProviders(<UserUnauthorised />);
    expect(screen.getByText(/Your account does not have necessary permissions/)).toBeInTheDocument();
    expect(screen.getByText(/Please reach out to Ace Support team/)).toBeInTheDocument();
  });

  it('should display the login button', () => {
    renderWithProviders(<UserUnauthorised />);
    expect(screen.getByText('LOGIN WITH PingID')).toBeInTheDocument();
  });

  it('should call persistor.purge and azureLogin when retry button is clicked', async () => {
    renderWithProviders(<UserUnauthorised />);
    
    const retryButton = screen.getByText('LOGIN WITH PingID');
    fireEvent.click(retryButton);
    
    await expect(persistor.purge).toHaveBeenCalled();
    expect(azureLogin).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    persistor.purge.mockRejectedValueOnce(new Error('Purge failed'));
    
    renderWithProviders(<UserUnauthorised />);
    
    const retryButton = screen.getByText('LOGIN WITH PingID');
    fireEvent.click(retryButton);
    
    await expect(persistor.purge).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});

