import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function PaymentCardsUpload() {
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
      // After successful upload, update the payment cards image config
      try {
        const response = await fetch('/api/admin/site-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'paymentCardsImage',
            value: data.url,
            description: 'Payment cards image URL for footer',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update payment cards image config');
        }
        
        // Success message
        toast({
          title: "Payment cards image updated",
          description: "The payment cards image has been successfully updated",
        });
        
        // Invalidate the query to refresh the image
        queryClient.invalidateQueries({ queryKey: ['/api/site-config', 'paymentCardsImage'] });
        
        // Reset the form
        setSelectedFile(null);
        setIsUploading(false);
      } catch (error: any) {
        toast({
          title: "Error updating payment cards image",
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
        <Label htmlFor="payment-cards-image">Payment Cards Image</Label>
        <Input 
          id="payment-cards-image" 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground">
          Upload an image showing payment method icons (recommended: Visa, Mastercard logos)
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
          'Upload & Update Payment Cards Image'
        )}
      </Button>
    </form>
  );
}