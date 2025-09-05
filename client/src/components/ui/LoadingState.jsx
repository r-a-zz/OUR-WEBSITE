import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-white/80 text-lg">{message}</p>
    </div>
  );
}
