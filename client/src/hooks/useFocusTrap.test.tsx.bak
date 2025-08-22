import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import useFocusTrap from './useFocusTrap';

// Test component that uses the useFocusTrap hook
const TestComponent: React.FC<{
  isActive: boolean;
  onEscape?: () => void;
}> = ({ isActive, onEscape }) => {
  const containerRef = useFocusTrap(isActive, onEscape);
  
  return (
    <div ref={containerRef} data-testid="container">
      <button data-testid="button-1">Button 1</button>
      <button data-testid="button-2">Button 2</button>
      <button data-testid="button-3">Button 3</button>
    </div>
  );
};

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Create a mock body element to test focus restoration
    document.body.innerHTML = '<button data-testid="outside-button">Outside</button>';
    const outsideButton = document.querySelector('[data-testid="outside-button"]');
    if (outsideButton) {
      (outsideButton as HTMLElement).focus();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should focus the first focusable element when activated', () => {
    render(<TestComponent isActive={true} />);
    
    // First button should be focused automatically
    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  it('should not trap focus when not active', () => {
    render(<TestComponent isActive={false} />);
    
    // No focus change should happen
    expect(screen.getByTestId('outside-button')).toHaveFocus();
  });

  it('should trap focus using Tab key', () => {
    render(<TestComponent isActive={true} />);
    
    // First button should be focused initially
    expect(screen.getByTestId('button-1')).toHaveFocus();
    
    // Tab to next element
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' });
    expect(screen.getByTestId('button-2')).toHaveFocus();
    
    // Tab to last element
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' });
    expect(screen.getByTestId('button-3')).toHaveFocus();
    
    // Tab should cycle back to first element
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' });
    expect(screen.getByTestId('button-1')).toHaveFocus();
  });

  it('should handle Shift+Tab to navigate backwards', () => {
    render(<TestComponent isActive={true} />);
    
    // First button should be focused initially
    expect(screen.getByTestId('button-1')).toHaveFocus();
    
    // Shift+Tab should wrap to the last element
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab', shiftKey: true });
    expect(screen.getByTestId('button-3')).toHaveFocus();
    
    // Shift+Tab again should go to the second element
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab', shiftKey: true });
    expect(screen.getByTestId('button-2')).toHaveFocus();
  });

  it('should call onEscape when Escape key is pressed', () => {
    const handleEscape = jest.fn();
    render(<TestComponent isActive={true} onEscape={handleEscape} />);
    
    // Press Escape key
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    
    // onEscape should be called
    expect(handleEscape).toHaveBeenCalledTimes(1);
  });

  it('should not call onEscape when Escape key is pressed if not active', () => {
    const handleEscape = jest.fn();
    render(<TestComponent isActive={false} onEscape={handleEscape} />);
    
    // Press Escape key
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    
    // onEscape should not be called
    expect(handleEscape).not.toHaveBeenCalled();
  });
}); 