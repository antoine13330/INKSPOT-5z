import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Create S3 client only if credentials are available
const createS3Client = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not found - S3 functionality will be disabled');
    return null;
  }
  
  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const s3Client = createS3Client();
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Check if S3 is properly configured
const isS3Configured = () => {
  return process.env.AWS_ACCESS_KEY_ID && 
         process.env.AWS_SECRET_ACCESS_KEY && 
         process.env.AWS_S3_BUCKET && 
         process.env.AWS_REGION;
};

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  // If S3 is not configured, use local upload as fallback
  if (!isS3Configured()) {
    return await uploadToLocal(file, fileName, contentType);
  }

  if (!s3Client) {
    throw new Error('S3 client is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${fileName}`,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
  return `https://${BUCKET_NAME}.s3.amazonaws.com/uploads/${fileName}`;
}

// Local upload fallback function
async function uploadToLocal(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, file);
    
    // Return the public URL
    return `/uploads/avatars/${fileName}`;
  } catch (error) {
    console.error('Error uploading to local storage:', error);
    throw new Error('Failed to upload file to local storage');
  }
}

export async function deleteFromS3(fileName: string): Promise<void> {
  if (!isS3Configured()) {
    // For local files, we could implement deletion here if needed
    console.warn('Local file deletion not implemented');
    return;
  }

  if (!s3Client) {
    throw new Error('S3 client is not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${fileName}`,
  });

  await s3Client.send(command);
}

export async function getSignedDownloadUrl(fileName: string): Promise<string> {
  if (!isS3Configured()) {
    // For local files, return the direct path
    return `/uploads/avatars/${fileName}`;
  }

  if (!s3Client) {
    throw new Error('S3 client is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${fileName}`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${userId}_${timestamp}_${randomString}.${extension}`;
}

export function generateS3Key(fileName: string, folder: string = 'uploads'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${folder}/${timestamp}_${randomString}.${extension}`;
}
