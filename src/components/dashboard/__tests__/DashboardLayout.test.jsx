import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardLayout from '../DashboardLayout';

describe('DashboardLayout', () => {
  it('should render without crashing', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <DashboardLayout>
        <div data-testid="child-content">Child Content</div>
      </DashboardLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <DashboardLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </DashboardLayout>
    );
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('should apply correct styling classes to outer container', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass('flex');
    expect(outerDiv).toHaveClass('justify-center');
    expect(outerDiv).toHaveClass('p-6');
    expect(outerDiv).toHaveClass('h-full');
    expect(outerDiv).toHaveClass('w-full');
    expect(outerDiv).toHaveClass('overflow-hidden');
  });

  it('should apply correct styling to inner container', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    
    const innerDiv = container.querySelector('.bg-white');
    expect(innerDiv).toBeInTheDocument();
    expect(innerDiv).toHaveClass('w-full');
    expect(innerDiv).toHaveClass('max-w-[1800px]');
    expect(innerDiv).toHaveClass('rounded-xl');
    expect(innerDiv).toHaveClass('shadow-lg');
    expect(innerDiv).toHaveClass('h-full');
    expect(innerDiv).toHaveClass('overflow-hidden');
    expect(innerDiv).toHaveClass('flex');
    expect(innerDiv).toHaveClass('flex-col');
  });

  it('should handle empty children', () => {
    render(<DashboardLayout>{null}</DashboardLayout>);
    const container = document.querySelector('.bg-white');
    expect(container).toBeInTheDocument();
  });

  it('should handle undefined children', () => {
    render(<DashboardLayout>{undefined}</DashboardLayout>);
    const container = document.querySelector('.bg-white');
    expect(container).toBeInTheDocument();
  });

  it('should render complex nested children', () => {
    render(
      <DashboardLayout>
        <div>
          <h1>Title</h1>
          <section>
            <p>Description</p>
            <button>Action</button>
          </section>
        </div>
      </DashboardLayout>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should maintain proper DOM structure', () => {
    const { container } = render(
      <DashboardLayout>
        <div data-testid="content">Content</div>
      </DashboardLayout>
    );
    
    const outerDiv = container.firstChild;
    const innerDiv = outerDiv.firstChild;
    const content = screen.getByTestId('content');
    
    expect(outerDiv).toContainElement(innerDiv);
    expect(innerDiv).toContainElement(content);
  });

  it('should render React components as children', () => {
    const ChildComponent = () => <div data-testid="child-component">Child Component</div>;
    
    render(
      <DashboardLayout>
        <ChildComponent />
      </DashboardLayout>
    );
    
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
  });

  it('should render text content directly', () => {
    render(
      <DashboardLayout>
        Plain text content
      </DashboardLayout>
    );
    expect(screen.getByText('Plain text content')).toBeInTheDocument();
  });

  it('should render array of children', () => {
    const children = [
      <div key="1">Item 1</div>,
      <div key="2">Item 2</div>,
      <div key="3">Item 3</div>,
    ];
    
    render(<DashboardLayout>{children}</DashboardLayout>);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});
