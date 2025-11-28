import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press for modal closure
 * Standardizes keyboard handling across all modal components
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function to close the modal
 */
export function useModalKeyboard(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
}
