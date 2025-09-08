import { useEffect } from 'react';

export function useKeyboard(keyMap) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const handler = keyMap[event.key] || keyMap[event.code];
      if (handler && typeof handler === 'function') {
        const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
        if (!isInInput || event.key === 'Escape') {
          handler(event);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyMap]);
}
