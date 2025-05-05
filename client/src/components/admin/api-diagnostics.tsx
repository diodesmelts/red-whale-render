import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// API Diagnostics component with Image URL fixing tool
export function ApiDiagnostics() {
  const [isFixingUrls, setIsFixingUrls] = useState(false);
  const [fixResults, setFixResults] = useState<{
    competitionsFixed: number;
    configsFixed: number;
  } | null>(null);
  const { toast } = useToast();

  // Mutation for fixing image URLs
  const fixImageUrlsMutation = useMutation({
    mutationFn: async () => {
      setIsFixingUrls(true);
      try {
        const res = await apiRequest("POST", "/api/admin/fix-image-urls");
        if (!res.ok) {
          throw new Error("Failed to fix image URLs");
        }
        return res.json();
      } finally {
        setIsFixingUrls(false);
      }
    },
    onSuccess: (data) => {
      setFixResults({
        competitionsFixed: data.competitionsFixed,
        configsFixed: data.configsFixed
      });
      toast({
        title: "URL Fix Complete",
        description: `Fixed ${data.competitionsFixed} competition URLs and ${data.configsFixed} config URLs`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "URL Fix Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler for fixing image URLs
  const handleFixImageUrls = () => {
    fixImageUrlsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-blue-500" />
            API Diagnostics
          </CardTitle>
          <CardDescription>
            Authentication diagnostics are now logged directly to the server logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-500/10 rounded-md text-sm">
            <p>This server now has enhanced authentication logging enabled.</p>
            <p className="mt-2">Diagnostic information will appear in your production server logs, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Detailed session and cookie configuration</li>
              <li>Authentication attempts and request headers</li>
              <li>Environment variables affecting authentication</li>
              <li>Cross-domain cookie transmission details</li>
            </ul>
            <p className="mt-3 text-blue-600">Check your Render logs for complete diagnostics.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-amber-500" />
            URL Fix Tool
          </CardTitle>
          <CardDescription>
            Fix absolute image URLs to make them work across domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-500/10 rounded-md text-sm">
            <p>This tool converts all image URLs in the database from absolute URLs (with domain) to relative URLs (path only).</p>
            <p className="mt-2">Use this when:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Moving the site from Replit to Render or another hosting</li>
              <li>Changing the domain of your website</li>
              <li>Experiencing blank images after deployment</li>
            </ul>
            <p className="mt-3 font-medium">This operation cannot be undone. It's recommended to back up your database first.</p>
            
            {fixResults && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="font-medium text-green-800">Fix completed successfully!</p>
                <p className="mt-1">Fixed {fixResults.competitionsFixed} competition URLs and {fixResults.configsFixed} config URLs.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="secondary" 
            onClick={handleFixImageUrls}
            disabled={isFixingUrls}
            className="bg-amber-500/80 hover:bg-amber-500 text-white"
          >
            {isFixingUrls ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing URLs...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Fix Image URLs
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}