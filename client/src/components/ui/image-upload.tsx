import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { useDebugOverlay } from "./debug-overlay";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export function ImageUpload({
  onImageUploaded,
  currentImageUrl = "",
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImageUrl);
  const { toast } = useToast();
  const { showError, DebugOverlayComponent } = useDebugOverlay();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Use the apiRequest helper which properly handles API URL routing
      const apiUrl = '/api/upload';
      console.log("Starting upload to:", apiUrl);
      
      // Log the request being made for diagnostics
      const requestInfo = {
        url: apiUrl,
        method: "POST",
        formDataKeys: Array.from(formData.keys()), // Use Array.from to avoid TS iterator issue
        hasImageFile: formData.has('image'),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
      console.log("Upload request details:", requestInfo);
      
      // Use apiRequest directly with FormData (no conversion)
      const response = await apiRequest("POST", apiUrl, undefined, {
        body: formData,
        processData: false, // Don't process the data
        contentType: false, // Let the browser set the content type for FormData
      });
      
      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(Array.from(response.headers.entries())),
        url: response.url,
        redirected: response.redirected,
        type: response.type,
      };
      console.log("Upload response received:", responseInfo);

      if (!response.ok) {
        // Try to get detailed error information from the response
        let errorDetail = "Failed to upload image";
        let errorData = null;
        let responseText = "";
        
        try {
          errorData = await response.json();
          errorDetail = errorData.message || errorData.details || errorDetail;
          console.error("Upload error details:", errorData);
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
          // If we can't parse the error response, use the status text and full URL
          errorDetail = `Failed to upload image (${response.status}: ${response.statusText})`;
          try {
            responseText = await response.text();
            console.error("Response text:", responseText);
          } catch (e) {
            responseText = "Could not read response text";
            console.error(responseText);
          }
        }
        
        // Show detailed error information in the debug overlay
        showError({
          title: `Upload Failed (${response.status}: ${response.statusText})`,
          message: errorDetail,
          details: responseText || (errorData ? JSON.stringify(errorData, null, 2) : ""),
          requestInfo,
          responseInfo,
          apiUrl: apiUrl
        });
        
        throw new Error(errorDetail);
      }

      const data = await response.json();
      console.log("Upload success response:", data);
      onImageUploaded(data.url);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      let errorMessage = "Upload failed";
      let errorDetail = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = "Upload failed";
        errorDetail = error.message;
      }
      
      toast({
        title: errorMessage,
        description: "Check the error details panel for more information",
        variant: "destructive",
      });
      
      // Reset preview if upload fails
      setPreview(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setPreview("");
    onImageUploaded("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="max-w-sm"
        />

        {isUploading && (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {preview && (
        <div className="relative border rounded-md overflow-hidden mt-4">
          <img
            src={preview}
            alt="Image preview"
            className="max-h-[300px] w-auto object-contain mx-auto"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!preview && !isUploading && (
        <div className="border border-dashed rounded-md p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Drag and drop an image or click the browse button above
          </p>
        </div>
      )}
      
      {/* Debug overlay for developer-friendly error information */}
      <DebugOverlayComponent />
    </div>
  );
}