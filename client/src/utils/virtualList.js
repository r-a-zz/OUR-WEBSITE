import { useState } from 'react';

export function useVirtualList(items, itemHeight = 180, containerHeight = 600) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}
