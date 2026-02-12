import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';
import { renderWithProviders } from './testUtils';
import { loginSuccess } from '../../redux/reducers/authSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the logo image
jest.mock('../../assets/Logo and Title-1.svg', () => 'logo.svg');

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render without crashing', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('Planogram Tool By Kenvue')).toBeInTheDocument();
  });

  it('should display the login button', () => {
    renderWithProviders(<Login />);
    const loginButton = screen.getByText('Login with PingID');
    expect(loginButton).toBeInTheDocument();
  });

  it('should display the OR divider', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('should handle SSO login click and dispatch loginSuccess', () => {
    const { store } = renderWithProviders(<Login />);
    const loginButton = screen.getByText('Login with PingID');
    
    fireEvent.click(loginButton);
    
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual({
      email: 'user@kenvue.com',
      name: 'User',
      access_groups: null,
    });
    expect(state.auth.token).toBe('eererere');
  });

  it('should navigate to /region after login', () => {
    renderWithProviders(<Login />);
    const loginButton = screen.getByText('Login with PingID');
    
    fireEvent.click(loginButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/region');
  });

  it('should render logo image', () => {
    const { container } = renderWithProviders(<Login />);
    const logo = container.querySelector('img[alt="Img"]');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'logo.svg');
  });

  it('should have correct styling classes', () => {
    const { container } = renderWithProviders(<Login />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'h-screen', 'font-sans');
  });
});

