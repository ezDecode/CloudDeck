import { S3Client, ListObjectsV2Command, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client = null;

/**
 * Initialize S3 client with credentials
 */
export const initializeS3Client = (credentials) => {
  s3Client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey,
    },
  });
  return s3Client;
};

/**
 * Get current S3 client instance
 */
export const getS3Client = () => {
  if (!s3Client) {
    throw new Error("S3 client not initialized. Please connect first.");
  }
  return s3Client;
};

/**
 * Test S3 connection by checking if bucket exists and is accessible
 */
export const testConnection = async (credentials) => {
  try {
    const tempClient = new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey,
      },
    });

    // Try to get bucket metadata
    const command = new HeadBucketCommand({ Bucket: credentials.bucket });
    await tempClient.send(command);
    
    return { success: true, message: "Connection successful!" };
  } catch (error) {
    console.error("Connection test failed:", error);
    
    let errorMessage = "Failed to connect to S3";
    
    if (error.name === "NotFound") {
      errorMessage = "Bucket not found. Please check the bucket name.";
    } else if (error.name === "Forbidden") {
      errorMessage = "Access denied. Please check your credentials and permissions.";
    } else if (error.name === "CredentialsError" || error.name === "InvalidUserCredentials") {
      errorMessage = "Invalid credentials. Please check your access key and secret key.";
    } else if (error.$metadata?.httpStatusCode === 400) {
      errorMessage = "Invalid request. Please check your bucket name and region.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, message: errorMessage, error };
  }
};

/**
 * List objects in the bucket
 */
export const listObjects = async (bucket, prefix = "", continuationToken = null) => {
  try {
    const client = getS3Client();
    const params = {
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000,
      Delimiter: "/",
    };
    
    if (continuationToken) {
      params.ContinuationToken = continuationToken;
    }
    
    const command = new ListObjectsV2Command(params);
    const response = await client.send(command);
    
    return {
      success: true,
      data: {
        objects: response.Contents || [],
        folders: response.CommonPrefixes || [],
        isTruncated: response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken,
      },
    };
  } catch (error) {
    console.error("Failed to list objects:", error);
    return {
      success: false,
      message: "Failed to list objects",
      error,
    };
  }
};

/**
 * Upload a file to S3
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {File} file - File object
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const uploadFile = async (bucket, key, file, onProgress) => {
  try {
    const client = getS3Client();
    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: file.type,
      },
    });

    upload.on("httpUploadProgress", (progress) => {
      if (onProgress && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      }
    });

    await upload.done();

    return { success: true };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return {
      success: false,
      message: "Failed to upload file",
      error,
    };
  }
};

/**
 * Download a file from S3
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @returns {Promise<{success: boolean, url?: string, message?: string, error?: any}>}
 */
export const downloadFile = async (bucket, key) => {
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { success: true, url };
  } catch (error) {
    console.error("Failed to download file:", error);
    return {
      success: false,
      message: "Failed to download file",
      error,
    };
  }
};

/**
 * Delete objects from S3
 * @param {string} bucket - Bucket name
 * @param {string[]} keys - Array of file keys to delete
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const deleteObjects = async (bucket, keys) => {
  try {
    const client = getS3Client();
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    });
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete objects:", error);
    return {
      success: false,
      message: "Failed to delete objects",
      error,
    };
  }
};

/**
 * Get stored credentials from localStorage
 */
export const getStoredCredentials = () => {
  const stored = localStorage.getItem("awsCredentials");
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clear S3 client instance
 */
export const clearS3Client = () => {
  s3Client = null;
};
