import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getApiBaseUrl } from "./lib/queryClient";

export default function ApiTest() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log("🔍 API Base URL:", apiBaseUrl);
      
      const testData = {
        username: "testuser" + Math.floor(Math.random() * 10000),
        email: `test${Math.floor(Math.random() * 10000)}@example.com`,
        password: "Test123!",
        confirmPassword: "Test123!",
        displayName: "Test User",
        mascot: "blue-whale",
        notificationSettings: {
          email: true,
          inApp: true
        },
        agreeToTerms: true
      };
      
      console.log("📤 Sending test registration data:", { ...testData, password: "REDACTED" });
      
      // Direct fetch to test API connection
      const response = await fetch(`${apiBaseUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testData),
        credentials: "include"
      });
      
      const responseData = await response.text();
      console.log(`📥 API Response (${response.status} ${response.statusText}):`, responseData);
      
      setTestResult(`Response ${response.status} ${response.statusText}: ${responseData}`);
    } catch (err) {
      console.error("❌ API test error:", err);
      setTestError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-md mt-8">
      <h2 className="text-lg font-semibold mb-4">API Connection Test</h2>
      
      <Button onClick={testApi} disabled={loading}>
        {loading ? "Testing..." : "Test API Connection"}
      </Button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-green-800">
          <p className="font-semibold">Success:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">{testResult}</pre>
        </div>
      )}
      
      {testError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
          <p className="font-semibold">Error:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">{testError}</pre>
        </div>
      )}
    </div>
  );
}