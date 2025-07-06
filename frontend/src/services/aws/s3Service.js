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
 * Clear stored credentials from localStorage
 */
export const clearStoredCredentials = () => {
  localStorage.removeItem("awsCredentials");
  s3Client = null;
};

/**
 * Initialize S3 client with credentials
 */
export const initializeS3Client = (credentials) => {
  // Validate credentials before initializing
  if (!credentials.accessKey || !credentials.secretKey || !credentials.bucketName || !credentials.region) {
    throw new Error("Invalid credentials: Access Key, Secret Key, Bucket, and Region are required");
  }

  s3Client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey,
    },
    requestHandler: {
      httpsAgent: undefined,
      httpAgent: undefined,
      metadata: {
        'User-Agent': 'CloudDeck/1.0'
      }
    },
    requestTimeout: 120000, // 2 minutes
    maxAttempts: 3,
    retryMode: 'adaptive',
    forcePathStyle: false,
    useAccelerateEndpoint: false,
    useDualstackEndpoint: false,
    checksumDisabled: true,
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
      } catch {
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
    if (!credentials.accessKey || !credentials.secretKey || !credentials.bucketName || !credentials.region) {
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
      requestTimeout: 30000, // 30 seconds for connection test
      maxAttempts: 2,
      retryMode: 'adaptive',
      forcePathStyle: false,
      useAccelerateEndpoint: false,
      useDualstackEndpoint: false
    });

    // Try to get bucket metadata - this tests both authentication
    const command = new HeadBucketCommand({ Bucket: credentials.bucketName });
    await tempClient.send(command);
    
    // Additional validation - try to list objects to ensure read permissions
    const listCommand = new ListObjectsV2Command({ 
      Bucket: credentials.bucketName, 
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
    
    // Enhanced error handling with specific permission messages
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and ensure it exists in the specified region.";
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Please check your credentials and ensure the IAM user has proper S3 permissions.";
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
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.$metadata?.httpStatusCode === 400) {
      errorMessage = "Invalid request. Please check your bucket name and region settings.";
    } else if (error.$metadata?.httpStatusCode >= 500) {
      errorMessage = "AWS service error. Please try again later.";
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
        bucket: credentials.bucketName
      }
    };
  }
};

/**
 * List objects in the bucket
 */
export const listObjects = async (bucket, prefix = "", continuationToken = null) => {
  try {
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    const params = {
      Bucket: bucket.trim(),
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
    
    if (error.message === 'Bucket name is required and cannot be empty') {
      errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Check your permissions.";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and region.";
    } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
      errorMessage = "Network error. Check your connection.";
    }
    
    return {
      success: false,
      message: errorMessage,
      error,
    };
  }
};

/**
 * Upload a file to S3 with chunked upload for large files
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {File} file - File object
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const uploadFile = async (bucket, key, file, onProgress) => {
  try {
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    
    // Enhanced upload configuration for better reliability
    const upload = new Upload({
      client,
      params: {
        Bucket: bucket.trim(),
        Key: key,
        Body: file,
        ContentType: file.type,
        // Disable automatic checksums to avoid CRC32 issues
        ChecksumAlgorithm: undefined,
      },
      // Configure multipart upload settings
      queueSize: 4, // Number of parts to upload concurrently
      partSize: 1024 * 1024 * 10, // 10MB parts for better chunking
      leavePartsOnError: false, // Clean up failed uploads
      // Disable automatic checksum validation to avoid the CRC32 issue
      checksumAlgorithm: undefined,
    });

    upload.on("httpUploadProgress", (progress) => {
      if (onProgress && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      }
    });

    const result = await upload.done();

    return { 
      success: true, 
      message: "File uploaded successfully",
      result: result
    };
  } catch (error) {
    console.error("Failed to upload file:", error);
    
    let errorMessage = "Failed to upload file";
    
    if (error.message === 'Bucket name is required and cannot be empty') {
      errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
      errorMessage = "Access denied. Check your write permissions.";
    } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
      errorMessage = "Bucket not found. Please verify the bucket name and region.";
    } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
      errorMessage = "Network error. Check your connection.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Upload timeout. Please try again or check your connection.";
    } else if (error.message?.includes("checksum") || error.name === "InvalidRequest") {
      errorMessage = "Checksum validation failed. Upload has been configured to retry without checksums.";
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
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket.trim(), Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { success: true, url };
  } catch (error) {
    console.error("Failed to download file:", error);
    
    let errorMessage = "Failed to download file";
    
    if (error.message === 'Bucket name is required and cannot be empty') {
      errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
    }
    
    return {
      success: false,
      message: errorMessage,
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
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    const command = new DeleteObjectsCommand({
      Bucket: bucket.trim(),
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    });
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete objects:", error);
    
    let errorMessage = "Failed to delete objects";
    
    if (error.message === 'Bucket name is required and cannot be empty') {
      errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
    }
    
    return {
      success: false,
      message: errorMessage,
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
 * Generate a shareable link for a file
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {number} expiresIn - Expiration time in seconds (default: 24 hours)
 * @returns {Promise<{success: boolean, url?: string, message?: string, error?: any}>}
 */
export const generateShareableLink = async (bucket, key, expiresIn = 86400, password = null) => {
  try {
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket.trim(), Key: key });
    let url = await getSignedUrl(client, command, { expiresIn });

    if (password) {
      // In a real-world scenario, you would use a backend service to handle password protection.
      // For this example, we'll add the password as a query parameter for demonstration purposes.
      // This is NOT a secure way to handle passwords.
      url += `&password=${encodeURIComponent(password)}`;
    }

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
    // Validate bucket parameter
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      throw new Error('Bucket name is required and cannot be empty');
    }

    const client = getS3Client();
    
    // Ensure the folder path ends with /
    const normalizedPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // Create an empty object with the folder path
    const command = new PutObjectCommand({
      Bucket: bucket.trim(),
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
    
    if (error.message === 'Bucket name is required and cannot be empty') {
      errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
    } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
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

/**
 * Upload large files (especially videos) with resumable capability
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {File} file - File object
 * @param {function} onProgress - Progress callback
 * @param {Object} options - Upload options
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const uploadLargeFile = async (bucket, key, file, onProgress, options = {}) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  const attemptUpload = async () => {
    try {
      // Validate bucket parameter
      if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
        throw new Error('Bucket name is required and cannot be empty');
      }

      const client = getS3Client();
      
      // Enhanced configuration for large files and videos
      const uploadConfig = {
        client,
        params: {
          Bucket: bucket.trim(),
          Key: key,
          Body: file,
          ContentType: file.type,
          // Disable automatic checksums to avoid the CRC32 issue
          ChecksumAlgorithm: undefined,
          // Metadata for tracking
          Metadata: {
            'original-filename': file.name,
            'upload-timestamp': new Date().toISOString(),
            'file-size': file.size.toString(),
          },
        },
        // Optimized settings for large files
        queueSize: 4, // Concurrent parts
        partSize: Math.max(1024 * 1024 * 10, Math.ceil(file.size / 10000)), // Dynamic part size, min 10MB
        leavePartsOnError: true, // Keep parts for resumption
        // Disable automatic checksum validation to avoid the CRC32 issue
        checksumAlgorithm: undefined,
      };

      // Add custom options
      if (options.partSize) {
        uploadConfig.partSize = options.partSize;
      }
      if (options.queueSize) {
        uploadConfig.queueSize = options.queueSize;
      }

      const upload = new Upload(uploadConfig);

      // Enhanced progress tracking
      upload.on("httpUploadProgress", (progress) => {
        if (onProgress && progress.total) {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          const uploadedMB = (progress.loaded / (1024 * 1024)).toFixed(2);
          const totalMB = (progress.total / (1024 * 1024)).toFixed(2);
          
          onProgress({
            percentage,
            loaded: progress.loaded,
            total: progress.total,
            uploadedMB,
            totalMB,
            part: progress.part,
          });
        }
      });

      const result = await upload.done();

      return { 
        success: true, 
        message: "Large file uploaded successfully",
        result: result,
        metadata: {
          bucket: bucket.trim(),
          key,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, error);
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES && 
          (error.name === 'NetworkingError' || 
           error.name === 'TimeoutError' ||
           error.name === 'InvalidRequest' || // Add retry for checksum-related issues
           error.$metadata?.httpStatusCode >= 500)) {
        
        retryCount++;
        console.log(`Retrying upload... Attempt ${retryCount}/${MAX_RETRIES}`);
        
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return attemptUpload();
      }
      
      // If we've exhausted retries or it's a non-retryable error
      let errorMessage = "Failed to upload large file";
      
      if (error.message === 'Bucket name is required and cannot be empty') {
        errorMessage = "Invalid bucket configuration. Please reconnect to your S3 account.";
      } else if (error.name === "Forbidden" || error.$metadata?.httpStatusCode === 403) {
        errorMessage = "Access denied. Check your write permissions.";
      } else if (error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
        errorMessage = "Bucket not found. Please verify the bucket name and region.";
      } else if (error.name === "NetworkingError" || error.code === "ENOTFOUND") {
        errorMessage = "Network error. Check your connection.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Upload timeout. Please try again or check your connection.";
      } else if (error.message?.includes("checksum") || error.name === "InvalidRequest") {
        errorMessage = "Checksum validation failed. Upload has been configured to retry without checksums.";
      }
      
      return {
        success: false,
        message: errorMessage,
        error,
        retryCount,
      };
    }
  };

  return attemptUpload();
};

/**
 * Retry failed uploads with exponential backoff
 * @param {function} uploadFunction - The upload function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise}
 */
export const retryUpload = async (uploadFunction, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadFunction();
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if error is retryable
      const isRetryable = 
        error.name === 'NetworkingError' ||
        error.name === 'TimeoutError' ||
        error.$metadata?.httpStatusCode >= 500 ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection');
      
      if (!isRetryable) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying upload... Attempt ${attempt + 2}/${maxRetries + 1}`);
    }
  }
  
  throw lastError;
};

/**
 * Check if a file is a video file
 * @param {File} file - File object
 * @returns {boolean}
 */
export const isVideoFile = (file) => {
  const videoTypes = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/m4v',
    'video/3gp',
    'video/quicktime'
  ];
  return videoTypes.includes(file.type.toLowerCase()) || 
         /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp)$/i.test(file.name);
};

/**
 * Smart upload function that chooses the best upload method based on file type and size
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {File} file - File object
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, message?: string, error?: any}>}
 */
export const smartUploadFile = async (bucket, key, file, onProgress) => {
  const isVideo = isVideoFile(file);
  const isLargeFile = file.size > 50 * 1024 * 1024; // 50MB threshold
  
  if (isVideo || isLargeFile) {
    // Use enhanced upload for videos and large files
    return uploadLargeFile(bucket, key, file, onProgress, {
      partSize: isVideo ? 1024 * 1024 * 20 : 1024 * 1024 * 10, // 20MB for videos, 10MB for others
      queueSize: isVideo ? 2 : 4, // Less concurrent uploads for videos to reduce errors
    });
  } else {
    // Use standard upload for small files
    return uploadFile(bucket, key, file, onProgress);
  }
};
