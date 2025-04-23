import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/queryClient";

export default function TestRegister() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Environment info to display in the results
  const [envInfo, setEnvInfo] = useState<{
    apiBaseUrl: string;
    appMode: string;
    hostname: string;
    isProduction: boolean;
  }>({
    apiBaseUrl: '',
    appMode: '',
    hostname: '',
    isProduction: false
  });

  // Collect environment information on component mount
  useEffect(() => {
    setEnvInfo({
      apiBaseUrl: getApiBaseUrl(),
      appMode: import.meta.env.MODE,
      hostname: window.location.hostname,
      isProduction: import.meta.env.MODE === 'production'
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('password') as string, // Same as password
      displayName: formData.get('displayName') as string,
      mascot: "Whale", // Default value
      notificationSettings: { email: true },
      agreeToTerms: true
    };
    
    try {
      // Get the API base URL using our improved function
      const apiBaseUrl = getApiBaseUrl();
      const registerUrl = `${apiBaseUrl}/register`; // Note: we're using /register, not /api/register because apiBaseUrl already has /api if needed
      
      console.log('Sending registration request with:', { 
        ...userData, 
        password: 'REDACTED', 
        confirmPassword: 'REDACTED' 
      });
      console.log('Registration endpoint URL:', registerUrl);
      
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Registration failed:', response.status, text);
        setError(`Registration failed: ${response.status} - ${text || response.statusText}`);
      } else {
        const data = await response.json();
        console.log('Registration successful:', data);
        setResult(data);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">API Registration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  defaultValue={`test${Date.now().toString().slice(-6)}`} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={`test${Date.now().toString().slice(-6)}@example.com`} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  name="displayName" 
                  defaultValue="Test User" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  defaultValue="Test123!" 
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Test Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                <p className="font-medium">Error</p>
                <p className="text-sm whitespace-pre-wrap">{error}</p>
              </div>
            )}
            
            {result && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
                <p className="font-medium">Success!</p>
                <pre className="text-sm mt-2 overflow-auto max-h-60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium">Request Details:</h3>
              <p className="text-sm">
                <strong>Endpoint:</strong> POST {`${envInfo.apiBaseUrl}/register`}<br />
                <strong>Content-Type:</strong> application/json<br />
                <strong>Credentials:</strong> include<br />
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <h3 className="font-medium text-blue-800">Environment Info:</h3>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li><strong>API Base URL:</strong> {envInfo.apiBaseUrl}</li>
                <li><strong>App Mode:</strong> {envInfo.appMode}</li>
                <li><strong>Hostname:</strong> {envInfo.hostname}</li>
                <li><strong>Production:</strong> {envInfo.isProduction ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}