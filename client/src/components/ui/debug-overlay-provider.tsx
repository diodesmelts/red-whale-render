import React, { useEffect } from 'react';
import { useDebugOverlay } from './debug-overlay';
import { errorEventEmitter, REPORT_ERROR_EVENT, SHOW_DEBUG_OVERLAY_EVENT } from '@/lib/queryClient';

/**
 * Provides the global debug overlay for the application.
 * This component connects the error event emitter to the debug overlay.
 * It listens for error events and shows the debug overlay when they occur.
 */
export function DebugOverlayProvider({ children }: { children: React.ReactNode }) {
  const { showError, DebugOverlayComponent } = useDebugOverlay();

  // Listen for error events from the event emitter
  useEffect(() => {
    const handleReportError = (errorDetails: any) => {
      console.log('Debug overlay received error report:', errorDetails);
      showError(errorDetails);
    };

    // Register the event listeners
    errorEventEmitter.on(REPORT_ERROR_EVENT, handleReportError);

    return () => {
      // Clean up event listeners
      errorEventEmitter.off(REPORT_ERROR_EVENT, handleReportError);
    };
  }, [showError]);

  return (
    <>
      {children}
      <DebugOverlayComponent />
    </>
  );
}