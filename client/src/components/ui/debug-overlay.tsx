import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails: {
    title: string;
    message: string;
    details?: string;
    timestamp: string;
    requestInfo?: any;
    responseInfo?: any;
    apiUrl?: string;
    finalApiUrl?: string;
  };
}

export function DebugOverlay({ isOpen, onClose, errorDetails }: DebugOverlayProps) {
  const [tab, setTab] = useState<'error' | 'request' | 'response'>('error');

  if (!isOpen) return null;

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return 'Error formatting object';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2">
              !
            </span>
            {errorDetails.title}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button 
              className={`px-4 py-2 font-medium ${tab === 'error' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setTab('error')}
            >
              Error
            </button>
            <button 
              className={`px-4 py-2 font-medium ${tab === 'request' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setTab('request')}
            >
              Request
            </button>
            <button 
              className={`px-4 py-2 font-medium ${tab === 'response' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setTab('response')}
            >
              Response
            </button>
          </div>
        </div>

        <div className="overflow-auto p-4 flex-grow">
          {tab === 'error' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">Error Message</h3>
                <p className="p-2 bg-muted rounded">{errorDetails.message}</p>
              </div>
              
              {errorDetails.details && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-1">Details</h3>
                  <pre className="p-2 bg-muted rounded whitespace-pre-wrap text-sm">{errorDetails.details}</pre>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Timestamp: {errorDetails.timestamp}
              </div>
            </div>
          )}

          {tab === 'request' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">Initial API URL</h3>
                <p className="p-2 bg-muted rounded">{errorDetails.apiUrl || 'Not available'}</p>
              </div>
              
              {errorDetails.finalApiUrl && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-1">Final API URL</h3>
                  <p className="p-2 bg-muted rounded">{errorDetails.finalApiUrl}</p>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">Request Information</h3>
                <pre className="p-2 bg-muted rounded whitespace-pre-wrap text-sm font-mono">
                  {formatJson(errorDetails.requestInfo || 'No request information available')}
                </pre>
              </div>
            </div>
          )}

          {tab === 'response' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">Response Information</h3>
                <pre className="p-2 bg-muted rounded whitespace-pre-wrap text-sm font-mono">
                  {formatJson(errorDetails.responseInfo || 'No response information available')}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function useDebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    details: string;
    timestamp: string;
    requestInfo: any;
    responseInfo: any;
    apiUrl: string;
    finalApiUrl?: string;
  }>({
    title: '',
    message: '',
    details: '',
    timestamp: '',
    requestInfo: null,
    responseInfo: null,
    apiUrl: '',
    finalApiUrl: undefined
  });

  const showError = (details: Partial<typeof errorDetails>) => {
    setErrorDetails({
      ...errorDetails,
      ...details,
      timestamp: new Date().toISOString()
    });
    setIsOpen(true);
  };

  const closeOverlay = () => {
    setIsOpen(false);
  };

  return {
    DebugOverlayComponent: () => (
      <DebugOverlay 
        isOpen={isOpen} 
        onClose={closeOverlay} 
        errorDetails={errorDetails} 
      />
    ),
    showError,
    closeOverlay
  };
}