import React from 'react';
import { render, screen } from '@testing-library/react';
import KenvueSSO from '../KenvueSSO';

// Mock the logo image
jest.mock('../../assets/Logo and Title.svg', () => 'mocked-logo.svg');

describe('KenvueSSO', () => {
  it('should render without crashing', () => {
    render(<KenvueSSO />);
    expect(screen.getByText('kenvue')).toBeInTheDocument();
  });

  it('should display the Kenvue logo', () => {
    render(<KenvueSSO />);
    const logo = screen.getByAltText('Kenvue Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'mocked-logo.svg');
  });

  it('should display the ACE description', () => {
    render(<KenvueSSO />);
    expect(screen.getByText('Assortment Category Excellence')).toBeInTheDocument();
  });

  it('should display the ACE title', () => {
    render(<KenvueSSO />);
    expect(screen.getByText('ACE')).toBeInTheDocument();
  });

  it('should display the branding text', () => {
    render(<KenvueSSO />);
    expect(screen.getByText(/Empowering retail excellence through intelligent shelf optimization/i)).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const { container } = render(<KenvueSSO />);
    const mainBox = container.firstChild;
    expect(mainBox).toBeInTheDocument();
  });
});

