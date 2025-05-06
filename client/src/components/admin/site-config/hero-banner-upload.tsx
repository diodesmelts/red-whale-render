import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function HeroBannerUpload() {
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
      // After successful upload, update the hero banner site config
      try {
        const response = await fetch('/api/site-config/heroBanner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'heroBanner',
            value: data.url,
            description: 'Homepage hero banner image URL',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update hero banner config');
        }
        
        // Success message
        toast({
          title: "Hero banner updated",
          description: "The hero banner image has been successfully updated",
        });
        
        // Invalidate the query to refresh the banner
        queryClient.invalidateQueries({ queryKey: ['/api/site-config', 'heroBanner'] });
        
        // Reset the form
        setSelectedFile(null);
        setIsUploading(false);
      } catch (error: any) {
        toast({
          title: "Error updating hero banner",
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
    formData.append('file', selectedFile);
    
    uploadMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hero-banner-image">Hero Banner Image</Label>
        <Input 
          id="hero-banner-image" 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground">
          Upload a high-quality image for the homepage hero banner (recommended size: 1920x600px)
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
          'Upload & Update Hero Banner'
        )}
      </Button>
    </form>
  );
}