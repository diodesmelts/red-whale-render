import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup Cloudinary if credentials are available
console.log('Checking Cloudinary configuration:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('Cloudinary configured for image uploads successfully!');
} else {
  console.log('Cloudinary not configured, using local storage for uploads');
}

interface UploadResult {
  url: string;
  publicId?: string; // For Cloudinary
}

/**
 * Storage service to handle file uploads
 * Will use Cloudinary if configured, otherwise falls back to local storage
 */
export const storageService = {
  /**
   * Upload a file to storage
   * @param file The file buffer to upload
   * @param originalFilename Original filename for reference
   */
  async uploadFile(file: Buffer, originalFilename: string): Promise<UploadResult> {
    // Use Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        return await this.uploadToCloudinary(file, originalFilename);
      } catch (error) {
        console.error('Cloudinary upload failed, falling back to local storage', error);
        // Fall back to local storage if Cloudinary fails
        return this.uploadToLocalStorage(file, originalFilename);
      }
    }
    
    // Otherwise use local storage
    return this.uploadToLocalStorage(file, originalFilename);
  },

  /**
   * Upload file to local storage
   */
  uploadToLocalStorage(file: Buffer, originalFilename: string): UploadResult {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalFilename);
    const filename = `image-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, file);
    
    return {
      url: `/${uploadsDir}/${filename}`
    };
  },

  /**
   * Upload file to Cloudinary
   */
  uploadToCloudinary(file: Buffer, originalFilename: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        public_id: `blue-whale/${uuidv4()}`,
        folder: 'competitions',
        resource_type: 'image' as 'image' // Type assertion to match Cloudinary's expected types
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: Error, result: UploadApiResponse) => {
          if (error || !result) {
            return reject(error || new Error('Upload failed'));
          }
          
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      );

      // Convert buffer to stream and pipe it to the upload stream
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(file);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  },

  /**
   * Delete a file from storage (useful for cleanup)
   * @param fileUrl URL of the file to delete
   */
  async deleteFile(fileUrl: string, publicId?: string): Promise<boolean> {
    // If it's a Cloudinary URL and publicId is provided
    if (publicId && isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
      } catch (error) {
        console.error('Error deleting file from Cloudinary', error);
        return false;
      }
    }
    
    // If it's a local file
    if (fileUrl.startsWith('/uploads/')) {
      const filePath = path.join('.', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    
    return false;
  }
};