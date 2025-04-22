import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';

export default function AuthBypass() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Logging in...');
  const { user } = useAuth();

  useEffect(() => {
    const loginAdmin = async () => {
      try {
        // Call our development-only endpoint to login as admin
        const response = await fetch('/api/dev/login-admin', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to login');
        }

        const data = await response.json();
        console.log('Direct login success:', data);
        
        // Set the user data directly in the query cache
        queryClient.setQueryData(['/api/user'], data.user);
        
        setStatus('success');
        setMessage('Login successful! Redirecting...');
        
        // Redirect after a brief delay
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } catch (error) {
        console.error('Direct login error:', error);
        setStatus('error');
        setMessage('Failed to login automatically. Please use the regular login page.');
      }
    };

    if (!user) {
      loginAdmin();
    } else {
      setStatus('success');
      setMessage('Already logged in! Redirecting...');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    }
  }, [navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-center text-primary">Admin Login Bypass</h1>
        
        <div className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <p className="text-lg text-center">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-lg text-center">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-lg text-center">{message}</p>
              <button 
                className="px-4 py-2 mt-4 font-semibold text-white bg-primary rounded-md hover:bg-primary/80"
                onClick={() => navigate('/auth')}
              >
                Go to Login Page
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}