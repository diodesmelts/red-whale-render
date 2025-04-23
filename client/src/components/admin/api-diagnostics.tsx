import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

// Simplified version with no UI diagnostics
export function ApiDiagnostics() {
  return (
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
  );
}