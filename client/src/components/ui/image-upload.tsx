import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

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
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      onImageUploaded(data.imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
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
    </div>
  );
}