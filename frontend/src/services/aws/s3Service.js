import { S3Client, ListObjectsV2Command, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client = null;

/**
 * Get stored credentials from localStorage
 */
export const getStoredCredentials = () => {
  const stored = localStorage.getItem("awsCredentials");
  return stored ? JSON.parse(stored) : null;
};

/**
 * Initialize S3 client with credentials
 */
export const initializeS3Client = (credentials) => {
  // Validate credentials before initializing
  if (!credentials.accessKey || !credentials.secretKey || !credentials.bucket || !credentials.region) {
    throw new Error("Invalid credentials: Access Key, Secret Key, Bucket, and Region are required");
  }

  s3Client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey,
    },
    // Enable CORS for browser requests
    requestHandler: {
      httpsAgent: undefined,
      httpAgent: undefined,
      metadata: {
        'User-Agent': 'CloudDeck/1.0'
      }
    },
    // Set appropriate timeouts
    requestTimeout: 120000, // 2 minutes
    maxAttempts: 3,
    retryMode: 'adaptive'
  });
  return s3Client;
};

/**
 * Get current S3 client instance
 */
export const getS3Client = () => {
  if (!s3Client) {
    // Try to auto-initialize if credentials are available
    const storedCredentials = getStoredCredentials();
    if (storedCredentials) {
      try {
        initializeS3Client(storedCredentials);
      } catch (error) {
        throw new Error("S3 client not initialized and failed to auto-initialize. Please check your credentials.");
      }
    } else {
      throw new Error("S3 client not initialized. Please connect first.");
    }
  }
  return s3Client;
};

/**
 * Test S3 connection by checking if bucket exists and is accessible
 */
export const testConnection = async (credentials) => {
  try {
    // Validate credentials first
    if (!credentials.accessKey || !credentials.secretKey || !credentials.bucket || !credentials.region) {
      return { 
        success: false, 
        message: "Invalid credentials: All fields (Access Key, Secret Key, Bucket, Region) are required" 
      };
    }

    const tempClient = new S3Client({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretKey,
      },
      // Enhanced configuration for better error handling
      requestTimeout: 30000, // 30 seconds for connection test
      maxAttempts: 2,
      retryMode: 'adaptive'
    });

    // Try to get bucket metadata - this tests both authentication and CORS
    const command = new HeadBucketCommand({ Bucket: credentials.bucket });
    const response = await tempClient.send(command);
    
    // Additional validation - try to list objects to ensure read permissions
    const listCommand = new ListObjectsV2Command({ 
      Bucket: credentials.bucket, 
      MaxKeys: 1 
    });
    await tempClient.send(listCommand);
    
    return { 
      success: true, 
      message: "Connection successful! Bucket is accessible with proper permissions.",
      metadata: {
        region: credentials.region,
        bucketExists: true,
        hasReadPermission: true
      }
    };
  } catch (error) {
    console.error("Connection test failed:", error);
    
    let errorMessage = "Failed to connect to S3";
    
    // Enhanced error handling with specific CORS and permission messages
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and ensure it exists in the specified region.";
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Please check your credentials and ensure the IAM user has proper S3 permissions. Also verify CORS configuration.";
    } else if (error.name === "CredentialsError" || error.name === "InvalidUserCredentials") {
      errorMessage = "Invalid credentials. Please verify your Access Key ID and Secret Access Key.";
    } else if (error.name === "InvalidAccessKeyId") {
      errorMessage = "Invalid Access Key ID. Please check your Access Key ID.";
    } else if (error.name === "SignatureDoesNotMatch") {
      errorMessage = "Invalid Secret Access Key. Please check your Secret Access Key.";
    } else if (error.name === "NoSuchBucket") {
      errorMessage = "Bucket does not exist. Please verify the bucket name and region.";
    } else if (error.name === "PermanentRedirect") {
      errorMessage = "Bucket is in a different region. Please verify the region setting.";
    } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
      errorMessage = "Network error. Please check your internet connection and ensure CORS is properly configured.";
    } else if (error.$metadata?.httpStatusCode === 400) {
      errorMessage = "Invalid request. Please check your bucket name and region settings.";
    } else if (error.$metadata?.httpStatusCode >= 500) {
      errorMessage = "AWS service error. Please try again later.";
    } else if (error.message?.includes("CORS")) {
      errorMessage = "CORS error. Please configure CORS policy on your S3 bucket to allow requests from your domain.";
    } else if (error.message) {
      errorMessage = `Connection failed: ${error.message}`;
    }
    
    return { 
      success: false, 
      message: errorMessage, 
      error: {
        name: error.name,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        region: credentials.region,
        bucket: credentials.bucket
      }
    };
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
    
    let errorMessage = "Failed to list objects";
    
    if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Check your permissions or CORS configuration.";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and region.";
    } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
      errorMessage = "Network error. Check your connection and CORS configuration.";
    } else if (error.message?.includes("CORS")) {
      errorMessage = "CORS error. Please configure CORS policy on your S3 bucket.";
    }
    
    return {
      success: false,
      message: errorMessage,
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

    return { success: true, message: "File uploaded successfully" };
  } catch (error) {
    console.error("Failed to upload file:", error);
    
    let errorMessage = "Failed to upload file";
    
    if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Check your write permissions or CORS configuration.";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and region.";
    } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
      errorMessage = "Network error. Check your connection and CORS configuration.";
    } else if (error.message?.includes("CORS")) {
      errorMessage = "CORS error. Please configure CORS policy on your S3 bucket.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Upload timeout. Please try again or check your connection.";
    }
    
    return {
      success: false,
      message: errorMessage,
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
 * Clear S3 client instance
 */
export const clearS3Client = () => {
  s3Client = null;
};

/**
 * Validate CORS configuration by making a preflight request
 */
export const validateCORS = async (credentials) => {
  try {
    const bucketUrl = `https://${credentials.bucket}.s3.${credentials.region}.amazonaws.com/`;
    
    const response = await fetch(bucketUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    
    if (response.ok) {
      return { success: true, message: "CORS configuration is valid" };
    } else {
      return { 
        success: false, 
        message: "CORS preflight failed. Please check your bucket's CORS configuration." 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: "Unable to validate CORS configuration. This may indicate CORS issues." 
    };
  }
};

/**
 * Generate CORS configuration for the bucket
 */
export const generateCORSConfig = (allowedOrigins = []) => {
  const origins = allowedOrigins.length > 0 ? allowedOrigins : [
    window.location.origin,
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  return [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: origins,
      ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
      MaxAgeSeconds: 3000
    }
  ];
};

/**
 * Generate a shareable link for a file
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {number} expiresIn - Expiration time in seconds (default: 24 hours)
 * @returns {Promise<{success: boolean, url?: string, message?: string, error?: any}>}
 */
export const generateShareableLink = async (bucket, key, expiresIn = 86400) => {
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn });
    return { 
      success: true, 
      url,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    };
  } catch (error) {
    console.error("Failed to generate shareable link:", error);
    return {
      success: false,
      message: "Failed to generate shareable link",
      error,
    };
  }
};

/**
 * Create a new folder in S3
 * @param {string} bucket - Bucket name
 * @param {string} folderPath - Folder path (should end with /)
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const createFolder = async (bucket, folderPath) => {
  try {
    const client = getS3Client();
    
    // Ensure the folder path ends with /
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // Create an empty object with the folder path
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: normalizedPath,
      Body: '',
      ContentType: 'application/x-directory'
    });
    
    await client.send(command);
    return { 
      success: true, 
      message: "Folder created successfully",
      folderPath: normalizedPath
    };
  } catch (error) {
    console.error("Failed to create folder:", error);
    
    let errorMessage = "Failed to create folder";
    
    if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Check your write permissions.";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name.";
    }
    
    return {
      success: false,
      message: errorMessage,
      error,
    };
  }
};

/**
 * Copy/duplicate a file or folder
 * @param {string} bucket - Bucket name
 * @param {string} sourceKey - Source file/folder key
 * @param {string} destinationKey - Destination file/folder key
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const copyObject = async (bucket, sourceKey, destinationKey) => {
  try {
    const client = getS3Client();
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: destinationKey,
      CopySource: `${bucket}/${sourceKey}`,
      MetadataDirective: 'COPY'
    });
    
    await client.send(command);
    return { 
      success: true, 
      message: "File copied successfully"
    };
  } catch (error) {
    console.error("Failed to copy object:", error);
    return {
      success: false,
      message: "Failed to copy file",
      error,
    };
  }
};
