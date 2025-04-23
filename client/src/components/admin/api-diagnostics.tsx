import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ApiDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [apiOriginCheck, setApiOriginCheck] = useState<{success: boolean; error?: string; data?: any} | null>(null);
  const [authCheck, setAuthCheck] = useState<{success: boolean; error?: string; data?: any} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Gather browser info
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
      
      // API health check
      try {
        const response = await fetch(`${apiUrl}/api/health`, { 
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
        const response = await fetch(`${apiUrl}/api/user`, { 
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
        apiUrl,
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Diagnostics</CardTitle>
        <CardDescription>
          Check API connectivity and diagnose authentication issues
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
            ) : "Run Diagnostics"}
          </Button>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive">
              {error}
            </div>
          )}
          
          {browserInfo && (
            <Accordion type="single" collapsible>
              <AccordionItem value="browser-info">
                <AccordionTrigger>Browser Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="font-medium">User Agent:</div>
                      <div className="col-span-2">{browserInfo.userAgent}</div>
                      
                      <div className="font-medium">Hostname:</div>
                      <div className="col-span-2">{browserInfo.hostname}</div>
                      
                      <div className="font-medium">URL:</div>
                      <div className="col-span-2">{browserInfo.href}</div>
                      
                      <div className="font-medium">Protocol:</div>
                      <div className="col-span-2">{browserInfo.protocol}</div>
                      
                      <div className="font-medium">Cookies Enabled:</div>
                      <div className="col-span-2">{browserInfo.cookies ? 'Yes' : 'No'}</div>
                      
                      <div className="font-medium">Language:</div>
                      <div className="col-span-2">{browserInfo.language}</div>
                      
                      <div className="font-medium">Platform:</div>
                      <div className="col-span-2">{browserInfo.platform}</div>
                      
                      <div className="font-medium">Screen Size:</div>
                      <div className="col-span-2">{browserInfo.screenSize}</div>
                      
                      <div className="font-medium">Viewport Size:</div>
                      <div className="col-span-2">{browserInfo.viewportSize}</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
      <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
        <p>Use this tool to diagnose API connectivity issues in production environments.</p>
        {results && <p className="mt-1">Last run: {results.timestamp}</p>}
      </CardFooter>
    </Card>
  );
}