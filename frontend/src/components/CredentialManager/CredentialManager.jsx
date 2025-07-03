import React, { useState } from "react";
import { testConnection, initializeS3Client, clearS3Client } from "../../services/aws/s3Service";

const LOCAL_STORAGE_KEY = "awsCredentials";

export default function CredentialManager({ onConnect }) {
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Load credentials from local storage on mount
  const validate = React.useCallback(() => {
    if (!accessKey || !secretKey || !bucket || !region) {
      setError("All fields are required.");
      return false;
    }
    setError("");
    return true;
  }, [accessKey, secretKey, bucket, region]);

  const handleConnect = React.useCallback(async (e, savedCreds = null) => {
    if (e) e.preventDefault();
    
    const credentials = savedCreds || { accessKey, secretKey, bucket, region };
    
    if (!savedCreds && !validate()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Test the connection
      const result = await testConnection(credentials);
      
      if (result.success) {
        // Initialize S3 client
        initializeS3Client(credentials);
        
        // Save to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
        
        setConnected(true);
        onConnect && onConnect(credentials);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to connect. Please check your credentials.");
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }, [accessKey, bucket, onConnect, region, secretKey, validate]);

  // Load credentials from local storage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const creds = JSON.parse(saved);
      setAccessKey(creds.accessKey || "");
      setSecretKey(creds.secretKey || "");
      setBucket(creds.bucket || "");
      setRegion(creds.region || "us-east-1");
      // Auto-connect if credentials exist
      handleConnect(null, creds);
    }
  }, [onConnect]);

  const handleDisconnect = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearS3Client();
    setAccessKey("");
    setSecretKey("");
    setBucket("");
    setRegion("us-east-1");
    setError("");
    setConnected(false);
    onConnect && onConnect(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 border border-neutral-200 dark:border-neutral-700">
      <h2 className="text-2xl font-bold mb-6 text-center text-neutral-800 dark:text-neutral-100">AWS S3 Credentials</h2>
      <form onSubmit={handleConnect} className="space-y-5">
        <div>
          <label htmlFor="accessKey" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Access Key</label>
          <input
            id="accessKey"
            type="text"
            className="block w-full rounded-md border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition ease-in-out duration-150"
            value={accessKey}
            onChange={e => setAccessKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="secretKey" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Secret Key</label>
          <input
            id="secretKey"
            type="password"
            className="block w-full rounded-md border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition ease-in-out duration-150"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="bucket" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bucket Name</label>
          <input
            id="bucket"
            type="text"
            className="block w-full rounded-md border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition ease-in-out duration-150"
            value={bucket}
            onChange={e => setBucket(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Region</label>
          <select
            id="region"
            className="block w-full rounded-md border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition ease-in-out duration-150"
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-east-2">US East (Ohio)</option>
            <option value="us-west-1">US West (N. California)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="eu-central-1">EU (Frankfurt)</option>
            <option value="ap-south-1">Asia Pacific (Mumbai)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
            <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
          </select>
        </div>
        {error && <div className="text-red-500 dark:text-red-400 text-sm text-center">{error}</div>}
        {!connected && (
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150"
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        )}
        {connected && (
          <>
            <div className="text-green-600 dark:text-green-400 text-sm text-center py-2">
              ✓ Connected to S3
            </div>
            <button
              type="button"
              className="w-full py-2 px-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-75 transition ease-in-out duration-150"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </>
        )}
      </form>
    </div>
  );
} 