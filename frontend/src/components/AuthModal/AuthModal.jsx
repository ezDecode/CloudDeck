import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { testConnection, initializeS3Client, clearS3Client } from '../../services/aws/s3Service';

const AuthModal = ({ isOpen, onClose, onConnect }) => {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [bucketName, setBucketName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [connected, setConnected] = useState(false);

  const LOCAL_STORAGE_KEY = "awsCredentials";

  const validateCredentials = (creds) => {
    if (!creds.accessKey || !creds.secretKey || !creds.bucketName || !creds.region) {
      setError("All fields are required.");
      return false;
    }
    if (creds.accessKey.length < 16 || creds.accessKey.length > 32) {
      setError("Access Key ID should be between 16-32 characters");
      return false;
    }
    if (creds.secretKey.length < 40) {
      setError("Secret Access Key should be at least 40 characters");
      return false;
    }
    return true;
  };

  const handleConnect = React.useCallback(async (credentials) => {
    if (!validateCredentials(credentials)) return;
    
    setIsLoading(true);
    setError("");
    setErrorDetails(null);
    
    try {
      const result = await testConnection(credentials);
      
      if (result.success) {
        initializeS3Client(credentials);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(credentials));
        
        setConnected(true);
        onConnect && onConnect(credentials);
        onClose(); // Close modal on successful connection
      } else {
        setError(result.message);
        setErrorDetails(result.error);
      }
    } catch (err) {
      setError("Failed to connect. Please check your credentials and network connection.");
      setErrorDetails(err);
      console.error("Connection error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onConnect, onClose]);

  // Load credentials on modal open
  useEffect(() => {
    if (!isOpen) return;
    
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (saved) {
      const creds = JSON.parse(saved);
      setAccessKey(creds.accessKey || "");
      setSecretKey(creds.secretKey || "");
      setBucketName(creds.bucketName || "");
      setRegion(creds.region || "eu-north-1");
      
      setConnected(true);
    }
  }, [isOpen]);

  const handleDisconnect = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clearS3Client();
    setAccessKey("");
    setSecretKey("");
    setBucketName("");
    setRegion("eu-north-1");
    setError("");
    setConnected(false);
    onConnect && onConnect(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const credentials = {
      accessKey,
      secretKey,
      bucketName,
      region
    };

    await handleConnect(credentials);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-secondary-bg rounded-[48px] p-6 md:p-8 lg:p-12 w-full max-w-[600px] mx-auto shadow-2xl max-h-[95vh] overflow-y-auto" 
        style={{ minHeight: '400px' }}
      >
        {/* Header - Left Aligned */}
        <div className="text-left mb-8 md:mb-10">
          <h2 className="text-[24px] md:text-[32px] font-[400] text-text-primary leading-[1.2] mb-2">
            <span className="italic">Think it.</span> <span className="italic">Store It.</span>
          </h2>
          <p className="text-[20px] md:text-[32px] font-[500] text-text-primary leading-[1.2]">
            Easy to use and Access.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 flex-1">
          <div>
            <input
              type="text"
              placeholder="Access ID"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full bg-neutral-white border-none rounded-[24px] px-6 md:px-8 py-3 text-[16px] md:text-[18px] text-text-primary placeholder-text-placeholder focus:outline-none transition-all duration-300 shadow-sm resize-none overflow-hidden"
              style={{
                color: accessKey ? '#000000' : '#999999',
                minHeight: '48px',
                maxHeight: '48px'
              }}
              required
              autoComplete="username"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Add secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full bg-neutral-white border-none rounded-[24px] px-6 md:px-8 py-3 text-[16px] md:text-[18px] text-text-primary placeholder-text-placeholder focus:outline-none transition-all duration-300 shadow-sm resize-none overflow-hidden"
              style={{
                color: secretKey ? '#000000' : '#999999',
                minHeight: '48px',
                maxHeight: '48px'
              }}
              required
              autoComplete="current-password"
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Bucket Name"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full bg-neutral-white border-none rounded-[24px] px-6 md:px-8 py-3 text-[16px] md:text-[18px] text-text-primary placeholder-text-placeholder focus:outline-none transition-all duration-300 shadow-sm resize-none overflow-hidden"
              style={{
                color: bucketName ? '#000000' : '#999999',
                minHeight: '48px',
                maxHeight: '48px'
              }}
              required
            />
          </div>
          
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-neutral-white border-none rounded-[24px] px-6 md:px-8 py-3 text-[16px] md:text-[18px] focus:outline-none transition-all duration-300 shadow-sm appearance-none cursor-pointer hover:shadow-md focus:shadow-lg pr-12 md:pr-14"
              style={{
                color: region ? '#000000' : '#999999',
                fontWeight: region ? '400' : '400'
              }}
              required
            >
                <option value="us-east-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">US East (N. Virginia)</option>
                <option value="us-east-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">US East (Ohio)</option>
                <option value="us-west-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">US West (N. California)</option>
                <option value="us-west-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">US West (Oregon)</option>
                <option value="ca-central-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Canada (Central)</option>
                <option value="ca-west-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Canada West (Calgary)</option>
                <option value="eu-central-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Frankfurt)</option>
                <option value="eu-central-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Zurich)</option>
                <option value="eu-west-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Ireland)</option>
                <option value="eu-west-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (London)</option>
                <option value="eu-west-3" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Paris)</option>
                <option value="eu-north-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Stockholm)</option>
                <option value="eu-south-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Milan)</option>
                <option value="eu-south-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Europe (Spain)</option>
                <option value="ap-east-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Hong Kong)</option>
                <option value="ap-south-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Mumbai)</option>
                <option value="ap-south-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Hyderabad)</option>
                <option value="ap-southeast-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Singapore)</option>
                <option value="ap-southeast-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Sydney)</option>
                <option value="ap-southeast-3" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Jakarta)</option>
                <option value="ap-southeast-4" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Melbourne)</option>
                <option value="ap-northeast-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Tokyo)</option>
                <option value="ap-northeast-2" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Seoul)</option>
                <option value="ap-northeast-3" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Asia Pacific (Osaka)</option>
                <option value="me-south-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Middle East (Bahrain)</option>
                <option value="me-central-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Middle East (UAE)</option>
                <option value="af-south-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Africa (Cape Town)</option>
                <option value="sa-east-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">South America (São Paulo)</option>
                <option value="il-central-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">Israel (Tel Aviv)</option>
                <option value="cn-north-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">China (Beijing)</option>
                <option value="cn-northwest-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">China (Ningxia)</option>
                <option value="us-gov-east-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">AWS GovCloud (US-East)</option>
                <option value="us-gov-west-1" className="text-[#000000] bg-white py-2 hover:bg-[#f0f0f0]">AWS GovCloud (US-West)</option>
            </select>
            
            {/* Custom Dropdown Arrow */}
            <div className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#999999" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-transform duration-200"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
          </div>
          
          {/* Enhanced Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-left p-3 bg-secondary-bg border border-neutral-borders text-text-secondary rounded-xl text-sm"
              >
                <p className="mb-2">{error}</p>
                
                {errorDetails && (
                  <p className="text-xs text-text-secondary mb-2">
                    {errorDetails.statusCode && `Status: ${errorDetails.statusCode}`}
                    {errorDetails.name && ` • ${errorDetails.name}`}
                  </p>
                )}
                
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="pt-4 md:pt-6">
            {!connected ? (
              <button
                type="submit"
                disabled={isLoading || !accessKey || !secretKey || !bucketName || !region}
                className="w-full bg-text-primary text-neutral-white text-[20px] md:text-[24px] font-[600] px-8 py-2 md:py-3 rounded-[24px] border-none cursor-pointer transition-all duration-300 hover:bg-text-secondary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  "Connect"
                )}
              </button>
            ) : (
              <button
                type="button"
                className="w-full bg-text-primary text-neutral-white text-[18px] md:text-[20px] font-[600] px-8 py-2 md:py-3 rounded-[24px] hover:bg-text-secondary transition-all duration-300 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
        
        {/* Footer Note - Left Aligned */}
        <p className="text-center mt-6 md:mt-8 text-[14px] md:text-[16px] text-text-secondary italic">
          🔒 All the keys are stored securely in your Local Storage.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthModal;