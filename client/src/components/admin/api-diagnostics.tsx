import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiBaseUrl } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ApiDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults(null);
    setError(null);
    
    try {
      // Get API base URL (will be different in production)
      const apiUrl = getApiBaseUrl();
      console.log(`Running diagnostics - API base URL: ${apiUrl || 'same-origin'}`);
      
      // API health check
      const healthCheckUrl = `${apiUrl || ''}/api/health`;
      console.log(`Health check URL: ${healthCheckUrl}`);
      
      const response = await fetch(healthCheckUrl, { 
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Structure results
        setResults({
          timestamp: new Date().toISOString(),
          apiUrl: apiUrl || 'same-origin',
          status: response.status,
          statusText: response.statusText,
          serverInfo: data.serverInfo,
          sessionInfo: data.session,
          configInfo: data.config,
          requestHeaders: data.headers,
        });
        
        toast({
          title: "Diagnostics Complete",
          description: "API diagnostics completed successfully",
        });
      } else {
        setError(`API health check failed: ${response.status} ${response.statusText}`);
        toast({
          variant: "destructive",
          title: "Diagnostics Failed",
          description: `HTTP Error: ${response.status} ${response.statusText}`
        });
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
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
    <Card className="border-blue-500/50 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-blue-500" />
          API Connectivity Test
        </CardTitle>
        <CardDescription>
          Test the connection between your browser and our API service
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
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run API Diagnostics
              </>
            )}
          </Button>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive text-destructive">
              {error}
            </div>
          )}
          
          {results && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">API Status:</div>
                <Badge className="bg-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" /> {results.status} {results.statusText}
                </Badge>
              </div>
              
              <Separator />
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="server-info">
                  <AccordionTrigger>Server Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {results.serverInfo && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Platform:</div>
                          <div>{results.serverInfo.platform}</div>
                          
                          <div className="font-medium">Node Version:</div>
                          <div>{results.serverInfo.nodeVersion}</div>
                          
                          <div className="font-medium">Uptime:</div>
                          <div>{Math.floor(results.serverInfo.uptime)} seconds</div>
                          
                          <div className="font-medium">Memory Usage:</div>
                          <div>{results.serverInfo.memory}</div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="session-info">
                  <AccordionTrigger>Session Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {results.sessionInfo && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Session Exists:</div>
                          <div>{results.sessionInfo.exists ? 'Yes' : 'No'}</div>
                          
                          <div className="font-medium">Session ID:</div>
                          <div className="break-all">{results.sessionInfo.id}</div>
                          
                          <div className="font-medium">Authenticated:</div>
                          <div>{results.sessionInfo.authenticated}</div>
                          
                          {results.sessionInfo.cookie && (
                            <>
                              <div className="font-medium">Cookie Domain:</div>
                              <div>{results.sessionInfo.cookie.domain || 'Not set'}</div>
                              
                              <div className="font-medium">Cookie Secure:</div>
                              <div>{results.sessionInfo.cookie.secure ? 'Yes' : 'No'}</div>
                              
                              <div className="font-medium">Cookie SameSite:</div>
                              <div>{results.sessionInfo.cookie.sameSite || 'Not set'}</div>
                              
                              <div className="font-medium">Cookie Max Age:</div>
                              <div>{results.sessionInfo.cookie.originalMaxAge ? 
                                    `${Math.floor(results.sessionInfo.cookie.originalMaxAge / 1000)} seconds` : 
                                    'Session only'}</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="config-info">
                  <AccordionTrigger>Configuration</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {results.configInfo && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Environment:</div>
                          <div>{results.configInfo.environment}</div>
                          
                          <div className="font-medium">API URL:</div>
                          <div className="break-all">{results.configInfo.apiUrl}</div>
                          
                          <div className="font-medium">Frontend URL:</div>
                          <div className="break-all">{results.configInfo.frontendUrl}</div>
                          
                          <div className="font-medium">Cookie Domain:</div>
                          <div>{results.configInfo.cookieDomain}</div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="request-info">
                  <AccordionTrigger>Request Headers</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {results.requestHeaders && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Host:</div>
                          <div className="break-all">{results.requestHeaders.host}</div>
                          
                          <div className="font-medium">Referer:</div>
                          <div className="break-all">{results.requestHeaders.referer}</div>
                          
                          <div className="font-medium">User Agent:</div>
                          <div className="break-all">{results.requestHeaders.userAgent}</div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {results && <p>Last run: {results.timestamp}</p>}
      </CardFooter>
    </Card>
  );
}