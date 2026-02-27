'use client';

import { useEffect } from 'react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only log in development to avoid console spam in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Something Went Wrong</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>
      </div>
      
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>

      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
      >
        Back to Home
      </button>

      {process.env.NODE_ENV === 'development' && error.message && (
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive text-destructive rounded text-sm max-w-md">
          <p className="font-semibold">Error Details (Development):</p>
          <pre className="mt-2 overflow-auto text-xs">{error.message}</pre>
        </div>
      )}
    </div>
  );
}
