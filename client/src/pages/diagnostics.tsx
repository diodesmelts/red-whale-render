import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DiagnosticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [apiOriginCheck, setApiOriginCheck] = useState<{success: boolean; error?: string; data?: any} | null>(null);
  const [authCheck, setAuthCheck] = useState<{success: boolean; error?: string; data?: any} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Gather browser info automatically on page load
    const info = {
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      href: window.location.href,
      cookies: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      doNotTrack: navigator.doNotTrack,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
        saveData: (navigator as any).connection.saveData,
      } : 'Not available'
    };
    
    setBrowserInfo(info);
    
    // Run diagnostics automatically on page load
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    setApiOriginCheck(null);
    setAuthCheck(null);
    
    try {
      // Get API base URL (will be different in production)
      const apiUrl = getApiBaseUrl();
      console.log(`Running diagnostics - API base URL: ${apiUrl || 'same-origin'}`);
      
      // API health check
      try {
        const healthCheckUrl = `${apiUrl || ''}/api/health`;
        console.log(`Health check URL: ${healthCheckUrl}`);
        
        const response = await fetch(healthCheckUrl, { 
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiOriginCheck({ success: true, data });
        } else {
          setApiOriginCheck({ 
            success: false, 
            error: `Status: ${response.status} ${response.statusText}` 
          });
        }
      } catch (err: any) {
        setApiOriginCheck({ 
          success: false, 
          error: `Request failed: ${err.message}` 
        });
      }
      
      // Auth check
      try {
        const authCheckUrl = `${apiUrl || ''}/api/user`;
        console.log(`Auth check URL: ${authCheckUrl}`);
        
        const response = await fetch(authCheckUrl, { 
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAuthCheck({ success: true, data });
        } else if (response.status === 401) {
          setAuthCheck({ 
            success: true, 
            data: { status: 401, message: 'Not authenticated (expected if not logged in)' } 
          });
        } else {
          setAuthCheck({ 
            success: false, 
            error: `Status: ${response.status} ${response.statusText}` 
          });
        }
      } catch (err: any) {
        setAuthCheck({ 
          success: false, 
          error: `Request failed: ${err.message}` 
        });
      }
      
      // Cookie check
      const hasCookies = document.cookie.length > 0;
      
      // Compile results
      setResults({
        timestamp: new Date().toISOString(),
        apiUrl: apiUrl || 'same-origin',
        hasCookies,
        cookieDetails: document.cookie.split(';').map(c => c.trim()),
      });
      
    } catch (err: any) {
      setError(`Error running diagnostics: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Diagnostics Failed",
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-5xl">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">API Connectivity Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            This page helps diagnose connectivity and authentication issues between the frontend and backend API
          </p>
        </div>
        
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Status of the connection between your browser and our API service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : "Run Diagnostics Again"}
              </Button>
              
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive">
                  {error}
                </div>
              )}
              
              {apiOriginCheck && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">API Health Check</h3>
                    {apiOriginCheck.success ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" /> Failed
                      </Badge>
                    )}
                  </div>
                  <Separator className="my-2" />
                  {apiOriginCheck.success ? (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="api-health-data">
                        <AccordionTrigger>View Response Data</AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs overflow-auto p-2 bg-muted rounded-md max-h-[300px]">
                            {JSON.stringify(apiOriginCheck.data, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <div className="text-destructive">{apiOriginCheck.error}</div>
                  )}
                </div>
              )}
              
              {authCheck && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Authentication Check</h3>
                    {authCheck.success ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" /> Failed
                      </Badge>
                    )}
                  </div>
                  <Separator className="my-2" />
                  {authCheck.success ? (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="auth-data">
                        <AccordionTrigger>View Response Data</AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs overflow-auto p-2 bg-muted rounded-md max-h-[300px]">
                            {JSON.stringify(authCheck.data, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <div className="text-destructive">{authCheck.error}</div>
                  )}
                </div>
              )}
              
              {results && (
                <>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Cookies</h3>
                      {results.hasCookies ? (
                        <Badge className="bg-green-600">Present</Badge>
                      ) : (
                        <Badge variant="destructive">No Cookies</Badge>
                      )}
                    </div>
                    <Separator className="my-2" />
                    {results.hasCookies ? (
                      <div className="text-xs space-y-1">
                        {results.cookieDetails.map((cookie: string, i: number) => (
                          <div key={i} className="p-1 bg-muted rounded">
                            {cookie}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-yellow-500">No cookies detected. This may cause authentication issues.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {results && <p>Last run: {results.timestamp}</p>}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>
              System environment details for debugging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-medium">Build Environment:</div>
                <div>{process.env.NODE_ENV || 'development'}</div>
                
                <div className="font-medium">App Version:</div>
                <div>1.0.0</div>
                
                <div className="font-medium">Deployment Type:</div>
                <div>{window.location.hostname.includes('replit') ? 'Development (Replit)' : 
                      window.location.hostname.includes('render') ? 'Production (Render)' : 
                      'Custom Domain'}</div>
                
                <div className="font-medium">Current URL:</div>
                <div className="break-all">{window.location.href}</div>
                
                <div className="font-medium">API Base URL:</div>
                <div className="break-all">{getApiBaseUrl() || 'Same origin'}</div>
                
                <div className="font-medium">Cross-Origin:</div>
                <div>{getApiBaseUrl() ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {browserInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
              <CardDescription>
                Details about your browser environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">User Agent:</span>
                    <div className="mt-1 text-xs break-all bg-muted p-2 rounded">
                      {browserInfo.userAgent}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Hostname:</div>
                    <div>{browserInfo.hostname}</div>
                    
                    <div className="font-medium">Protocol:</div>
                    <div>{browserInfo.protocol}</div>
                    
                    <div className="font-medium">Cookies Enabled:</div>
                    <div>{browserInfo.cookies ? 'Yes' : 'No'}</div>
                    
                    <div className="font-medium">Language:</div>
                    <div>{browserInfo.language}</div>
                    
                    <div className="font-medium">Platform:</div>
                    <div>{browserInfo.platform}</div>
                    
                    <div className="font-medium">Screen Size:</div>
                    <div>{browserInfo.screenSize}</div>
                    
                    <div className="font-medium">Viewport Size:</div>
                    <div>{browserInfo.viewportSize}</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">This information is helpful for diagnosing browser-specific issues.</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}