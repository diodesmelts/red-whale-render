import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function LogoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      // After successful upload, update the site logo config
      try {
        // Use the correct admin endpoint for updating site config
        const response = await fetch('/api/admin/site-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'siteLogo',
            value: data.url,
            description: 'Site logo image URL',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update site logo config');
        }
        
        // Success message
        toast({
          title: "Logo updated",
          description: "The site logo has been successfully updated",
        });
        
        // Invalidate the query to refresh the logo
        queryClient.invalidateQueries({ queryKey: ['/api/site-config', 'siteLogo'] });
        
        // Reset the form
        setSelectedFile(null);
        setIsUploading(false);
      } catch (error: any) {
        toast({
          title: "Error updating logo",
          description: error.message,
          variant: "destructive",
        });
        setIsUploading(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('image', selectedFile); // Using 'image' to match server expectation
    
    uploadMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="logo-image">Site Logo Image</Label>
        <Input 
          id="logo-image" 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground">
          Upload a logo image for the site navigation (recommended size: 300x100px, transparent PNG)
        </p>
      </div>
      
      <Button 
        type="submit" 
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          'Upload & Update Logo'
        )}
      </Button>
    </form>
  );
}