import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductItem from '../ProductItem';
import { getFallbackImage } from '../../../utils/productUtils';

jest.mock('../../../utils/productUtils', () => ({
  getFallbackImage: jest.fn(() => 'fallback-url'),
}));

const baseItem = {
  product_id: 'prod-1',
  name: 'Mint Toothpaste',
  image_url: 'https://example.com/mint.png',
  width: 120,
  height: 80,
};

const baseProvided = {
  innerRef: jest.fn(),
  draggableProps: { style: { transform: 'translate(10px, 20px)' } },
  dragHandleProps: {},
};

const renderItem = (props = {}) =>
  render(
    <ProductItem
      provided={baseProvided}
      snapshot={{ isDragging: false }}
      item={baseItem}
      onClick={jest.fn()}
      isViewOnly={false}
      dimmed={false}
      brandColor="#ffcc00"
      isHovered={false}
      onHover={jest.fn()}
      {...props}
    />,
  );

describe('ProductItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getFallbackImage.mockReturnValue('fallback-url');
  });

  describe('Image rendering', () => {
    it('renders product image when available', () => {
      renderItem();

      const img = screen.getByAltText('Mint Toothpaste');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', baseItem.image_url);
      expect(img).toHaveAttribute('draggable', 'false');
    });

    it('uses "product" as alt text when name is missing', () => {
      const itemWithoutName = { ...baseItem, name: undefined };
      renderItem({ item: itemWithoutName });

      const img = screen.getByAltText('product');
      expect(img).toBeInTheDocument();
    });

    it('falls back to placeholder image when load fails', () => {
      renderItem();
      const img = screen.getByAltText('Mint Toothpaste');

      fireEvent.error(img);

      expect(getFallbackImage).toHaveBeenCalledWith(baseItem);
      expect(screen.getByAltText('fallback')).toHaveAttribute('src', 'fallback-url');
    });

    it('renders fallback div when no image_url and no fallback image', () => {
      getFallbackImage.mockReturnValue(null);
      const itemWithoutImage = { ...baseItem, image_url: null };
      renderItem({ item: itemWithoutImage });

      const img = screen.queryByAltText('Mint Toothpaste');
      expect(img).not.toBeInTheDocument();
      const fallbackImg = screen.queryByAltText('fallback');
      expect(fallbackImg).not.toBeInTheDocument();
      
      const container = screen.getByRole('button');
      // The fallback div is the only child div (not an img)
      const fallbackDiv = container.querySelector('div:not([role])');
      expect(fallbackDiv).toBeInTheDocument();
      expect(fallbackDiv).toBeTruthy();
    });

    it('renders fallback image when image_url is missing', () => {
      const itemWithoutImage = { ...baseItem, image_url: null };
      renderItem({ item: itemWithoutImage });

      const img = screen.getByAltText('fallback');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'fallback-url');
    });
  });

  describe('Hover behavior', () => {
    it('calls onHover with product_id on mouse enter', () => {
      const onHover = jest.fn();
      renderItem({ onHover });

      const container = screen.getByRole('button');
      fireEvent.mouseEnter(container);

      expect(onHover).toHaveBeenCalledWith(baseItem.product_id);
    });

    it('calls onHover with null on mouse leave', () => {
      const onHover = jest.fn();
      renderItem({ onHover });

      const container = screen.getByRole('button');
      fireEvent.mouseEnter(container);
      fireEvent.mouseLeave(container);

      expect(onHover).toHaveBeenCalledWith(null);
    });

    it('applies hover transform when isHovered is true with provided', () => {
      renderItem({ isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.transform).toContain('translateY(-2px)');
    });

    it('applies scale transform when isHovered is true without provided', () => {
      renderItem({ provided: null, isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.transform).toBe('scale(1.1)');
    });

    it('applies no scale transform when isHovered is false without provided', () => {
      renderItem({ provided: null, isHovered: false });

      const container = screen.getByRole('button');
      expect(container.style.transform).toBe('scale(1)');
    });

    it('applies hover box shadow when isHovered is true', () => {
      renderItem({ isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.boxShadow).toBe('0 4px 12px rgba(0,0,0,0.1)');
    });

    it('applies hover z-index when isHovered is true', () => {
      renderItem({ isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.zIndex).toBe('10');
    });
  });

  describe('Drag and drop behavior', () => {
    it('applies dragging box shadow when isDragging is true', () => {
      renderItem({ snapshot: { isDragging: true } });

      const container = screen.getByRole('button');
      expect(container.style.boxShadow).toBe('0 8px 25px rgba(0,0,0,0.15)');
    });

    it('applies dragging z-index when isDragging is true', () => {
      renderItem({ snapshot: { isDragging: true } });

      const container = screen.getByRole('button');
      expect(container.style.zIndex).toBe('1000');
    });

    it('applies default box shadow when not dragging and not hovered', () => {
      renderItem({ isHovered: false, snapshot: { isDragging: false } });

      const container = screen.getByRole('button');
      expect(container.style.boxShadow).toBe('0 2px 4px  rgba(0,0,0,0.1)');
    });

    it('applies default z-index when not dragging and not hovered', () => {
      renderItem({ isHovered: false, snapshot: { isDragging: false } });

      const container = screen.getByRole('button');
      expect(container.style.zIndex).toBe('0');
    });

    it('combines drag transform with hover transform', () => {
      renderItem({ isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.transform).toContain('translate(10px, 20px)');
      expect(container.style.transform).toContain('translateY(-2px)');
    });

    it('handles missing drag transform gracefully', () => {
      const providedWithoutTransform = {
        ...baseProvided,
        draggableProps: { style: {} },
      };
      renderItem({ provided: providedWithoutTransform, isHovered: true });

      const container = screen.getByRole('button');
      expect(container.style.transform).toContain('translateY(-2px)');
    });
  });

  describe('Styling props', () => {
    it('applies dimmed styles when dimmed is true', () => {
      renderItem({ dimmed: true });

      const container = screen.getByRole('button');
      expect(container.style.opacity).toBe('0.3');
      expect(container.style.filter).toBe('grayscale(80%)');
      expect(container.style.pointerEvents).toBe('none');
    });

    it('does not apply dimmed styles when dimmed is false', () => {
      renderItem({ dimmed: false });

      const container = screen.getByRole('button');
      expect(container.style.opacity).toBe('');
      expect(container.style.filter).toBe('');
    });

    it('uses brandColor for backgroundColor', () => {
      renderItem({ brandColor: '#ff0000' });

      const container = screen.getByRole('button');
      expect(container.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('uses default white background when brandColor is not provided', () => {
      renderItem({ brandColor: undefined });

      const container = screen.getByRole('button');
      expect(container.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('applies mixBlendMode multiply when brandColor is provided', () => {
      renderItem({ brandColor: '#ffcc00' });

      const img = screen.getByAltText('Mint Toothpaste');
      expect(img.style.mixBlendMode).toBe('multiply');
    });

    it('applies mixBlendMode normal when brandColor is not provided', () => {
      renderItem({ brandColor: undefined });

      const img = screen.getByAltText('Mint Toothpaste');
      expect(img.style.mixBlendMode).toBe('normal');
    });

    it('removes border when item is empty', () => {
      const emptyItem = { ...baseItem, isEmpty: true };
      renderItem({ item: emptyItem });

      const container = screen.getByRole('button');
      expect(container.style.borderWidth).toBe('0px');
      expect(container.style.borderStyle).toBeFalsy();
    });

    it('applies border when item is not empty', () => {
      renderItem({ item: baseItem });

      const container = screen.getByRole('button');
      expect(container.style.border).toBe('0.01px solid rgb(224, 224, 224)');
    });

    it('removes borderBottom', () => {
      renderItem();

      const container = screen.getByRole('button');
      expect(container.style.borderBottomWidth).toBe('0px');
    });
  });

  describe('isViewOnly prop', () => {
    it('sets width and height to 100% when isViewOnly is true', () => {
      renderItem({ isViewOnly: true });

      const container = screen.getByRole('button');
      expect(container.style.width).toBe('100%');
      expect(container.style.height).toBe('100%');
    });

    it('uses item width and height when isViewOnly is false', () => {
      renderItem({ isViewOnly: false });

      const container = screen.getByRole('button');
      expect(container.style.width).toBe('120px');
      expect(container.style.height).toBe('80px');
    });

    it('sets image position to absolute when isViewOnly is true', () => {
      renderItem({ isViewOnly: true });

      const img = screen.getByAltText('Mint Toothpaste');
      expect(img.style.position).toBe('absolute');
      expect(img.style.top).toBe('0px');
      expect(img.style.left).toBe('0px');
    });

    it('sets image position to relative when isViewOnly is false', () => {
      renderItem({ isViewOnly: false });

      const img = screen.getByAltText('Mint Toothpaste');
      expect(img.style.position).toBe('relative');
    });

    it('sets fallback div position to absolute when isViewOnly is true', () => {
      getFallbackImage.mockReturnValue(null);
      const itemWithoutImage = { ...baseItem, image_url: null };
      renderItem({ item: itemWithoutImage, isViewOnly: true });

      const container = screen.getByRole('button');
      const fallbackDiv = container.querySelector('div:not([role])');
      expect(fallbackDiv).toBeTruthy();
      expect(fallbackDiv.style.position).toBe('absolute');
      expect(fallbackDiv.style.top).toBe('0px');
      expect(fallbackDiv.style.left).toBe('0px');
    });
  });

  describe('isViolationHighlighted', () => {
    it('applies violation outline and boxShadow when isViolationHighlighted is true', () => {
      renderItem({ isViolationHighlighted: true });

      const container = screen.getByRole('button');
      expect(container.style.outline).toContain('2px solid');
      expect(container.style.outline).toMatch(/#dc2626|rgb\(220,\s*38,\s*38\)/);
      expect(container.style.outlineOffset).toBe('-2px');
      expect(container.style.boxShadow).toMatch(/220|#dc2626/);
    });

    it('does not apply violation styles when isViolationHighlighted is false', () => {
      renderItem({ isViolationHighlighted: false });

      const container = screen.getByRole('button');
      expect(container.style.outline).toBe('');
      expect(container.style.outlineOffset).toBe('');
    });

    it('does not apply violation styles when item is empty', () => {
      const emptyItem = { ...baseItem, isEmpty: true };
      renderItem({ item: emptyItem, isViolationHighlighted: true });

      const container = screen.getByRole('button');
      expect(container.style.outline).toBe('');
    });
  });

  describe('Keyboard interactions', () => {
    it('calls onClick when Enter key is pressed', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: 'Enter' });

      expect(onClick).toHaveBeenCalled();
    });

    it('calls onClick when Space key is pressed', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: ' ' });

      expect(onClick).toHaveBeenCalled();
    });

    it('prevents default behavior on Enter key', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      fireEvent(container, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('prevents default behavior on Space key', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      fireEvent(container, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not call onClick for other keys', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: 'a' });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when dimmed and Enter is pressed', () => {
      const onClick = jest.fn();
      renderItem({ onClick, dimmed: true });

      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: 'Enter' });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when dimmed and Space is pressed', () => {
      const onClick = jest.fn();
      renderItem({ onClick, dimmed: true });

      const container = screen.getByRole('button');
      fireEvent.keyDown(container, { key: ' ' });

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Click handler', () => {
    it('invokes click handler on click', () => {
      const onClick = jest.fn();
      renderItem({ onClick });

      const container = screen.getByRole('button');
      fireEvent.click(container);
      expect(onClick).toHaveBeenCalled();
    });

    it('handles missing onClick gracefully', () => {
      const { container } = render(
        <ProductItem
          item={baseItem}
          onClick={undefined}
          isViewOnly={false}
          isHovered={false}
          onHover={jest.fn()}
        />,
      );

      const button = container.querySelector('[role="button"]');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has role="button"', () => {
      renderItem();

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('has tabIndex={0} when not dimmed', () => {
      renderItem();

      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('has tabIndex={-1} and aria-disabled when dimmed', () => {
      renderItem({ dimmed: true });

      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('tabIndex', '-1');
      expect(container).toHaveAttribute('aria-disabled', 'true');
    });

    it('has aria-label "Select product: {name}" when item has name', () => {
      renderItem();

      const container = screen.getByRole('button', { name: /Select product: Mint Toothpaste/i });
      expect(container).toBeInTheDocument();
    });

    it('has aria-label "Empty slot" when item is empty', () => {
      const emptyItem = { ...baseItem, isEmpty: true };
      renderItem({ item: emptyItem });

      const container = screen.getByRole('button', { name: 'Empty slot' });
      expect(container).toBeInTheDocument();
    });

    it('has aria-label "Select product" when item has no name', () => {
      const itemWithoutName = { ...baseItem, name: undefined };
      renderItem({ item: itemWithoutName });

      const container = screen.getByRole('button', { name: 'Select product' });
      expect(container).toBeInTheDocument();
    });
  });

  describe('Provided prop handling', () => {
    it('renders without provided prop', () => {
      renderItem({ provided: null });

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
    });

    it('applies draggableProps when provided is present', () => {
      renderItem();

      const container = screen.getByRole('button');
      expect(container.style.transform).toContain('translate(10px, 20px)');
    });

    it('does not apply draggable transform when provided is null', () => {
      renderItem({ provided: null });

      const container = screen.getByRole('button');
      expect(container.style.transform).not.toContain('translate(10px, 20px)');
    });
  });

  describe('Edge cases', () => {
    it('handles item with missing width and height', () => {
      const itemWithoutDimensions = { ...baseItem, width: undefined, height: undefined };
      renderItem({ item: itemWithoutDimensions, isViewOnly: false });

      const container = screen.getByRole('button');
      expect(container.style.width).toBe('');
      expect(container.style.height).toBe('');
    });

    it('handles item with null width and height', () => {
      const itemWithoutDimensions = { ...baseItem, width: null, height: null };
      renderItem({ item: itemWithoutDimensions, isViewOnly: false });

      const container = screen.getByRole('button');
      expect(container.style.width).toBe('');
      expect(container.style.height).toBe('');
    });

    it('handles onHover being undefined', () => {
      const { container } = render(
        <ProductItem
          item={baseItem}
          onClick={jest.fn()}
          isViewOnly={false}
          isHovered={false}
          onHover={undefined}
        />,
      );

      const button = container.querySelector('[role="button"]');
      expect(() => {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      }).not.toThrow();
    });

    it('handles snapshot being undefined', () => {
      renderItem({ snapshot: undefined });

      const container = screen.getByRole('button');
      expect(container).toBeInTheDocument();
      expect(container.style.zIndex).toBe('0');
    });

    it('handles snapshot.isDragging being undefined', () => {
      renderItem({ snapshot: {} });

      const container = screen.getByRole('button');
      expect(container.style.zIndex).toBe('0');
    });
  });
});

