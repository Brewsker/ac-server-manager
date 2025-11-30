import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for BIOS-style keyboard navigation in modals
 * Supports arrow keys, Enter/NumEnter, and Escape
 * 
 * @param {number} buttonCount - Total number of buttons in the modal
 * @param {Function} onConfirm - Callback when Enter is pressed
 * @param {Function} onCancel - Callback when Escape is pressed
 * @param {number} defaultIndex - Default selected button index (0-based)
 * @returns {Object} - { selectedIndex, buttonRefs, focusButton }
 */
export function useKeyboardNav(buttonCount, onConfirm, onCancel, defaultIndex = 0) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const buttonRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, buttonCount);
  }, [buttonCount]);

  // Focus the selected button
  const focusButton = (index) => {
    if (buttonRefs.current[index]) {
      buttonRefs.current[index].focus();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev > 0 ? prev - 1 : buttonCount - 1;
            setTimeout(() => focusButton(newIndex), 0);
            return newIndex;
          });
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex((prev) => {
            const newIndex = prev < buttonCount - 1 ? prev + 1 : 0;
            setTimeout(() => focusButton(newIndex), 0);
            return newIndex;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (onConfirm) {
            onConfirm(selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (onCancel) {
            onCancel();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Focus the default button on mount
    setTimeout(() => focusButton(selectedIndex), 0);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, buttonCount, onConfirm, onCancel]);

  return {
    selectedIndex,
    buttonRefs,
    focusButton
  };
}
