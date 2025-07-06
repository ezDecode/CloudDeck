import React, { useState } from "react";
import { generateShareableLink } from "../../services/aws/s3Service";
import { getStoredCredentials } from "../../services/aws/s3Service";

export default function ShareModal({ isOpen, onClose, selectedFile }) {
  const [shareLink, setShareLink] = useState("");
  const [timeUnit, setTimeUnit] = useState("minutes"); // minutes or hours
  const [customTime, setCustomTime] = useState(60); // Default to 60 minutes (1 hour)
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Calculate max time based on unit
  const getMaxTime = () => {
    return timeUnit === "minutes" ? 360 : 6; // 360 minutes = 6 hours
  };

  // Convert time to seconds for API
  const getExpiresInSeconds = () => {
    return timeUnit === "minutes" ? customTime * 60 : customTime * 3600;
  };

  // Format display time
  const getTimeDisplay = () => {
    if (timeUnit === "minutes") {
      if (customTime < 60) return `${customTime} minute${customTime !== 1 ? "s" : ""}`;
      const hours = Math.floor(customTime / 60);
      const mins = customTime % 60;
      return mins === 0 ? `${hours} hour${hours !== 1 ? "s" : ""}` : `${hours}h ${mins}m`;
    }
    return `${customTime} hour${customTime !== 1 ? "s" : ""}`;
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError("");
    
    try {
      const credentials = getStoredCredentials();
      if (!credentials) {
        setError("No credentials found. Please connect to S3 first.");
        return;
      }

      const expiresInSeconds = getExpiresInSeconds();
      const result = await generateShareableLink(credentials.bucketName, selectedFile.key, expiresInSeconds, password);
      
      if (result.success) {
        setShareLink(result.url);
      } else {
        setError(result.message || "Failed to generate share link");
      }
    } catch (err) {
      setError("Failed to generate share link");
      console.error("Share link generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleClose = () => {
    setShareLink("");
    setError("");
    setCopied(false);
    setCustomTime(60);
    setTimeUnit("minutes");
    setPassword("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-text-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-neutral-white border border-neutral-borders rounded-[24px] shadow-xl max-w-md w-full p-8 transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-text-primary rounded-[12px] flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h2 className="text-[24px] font-[400] text-text-primary">
              Share File
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-text-placeholder hover:text-text-secondary transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="mb-8 p-6 bg-secondary-bg border border-neutral-borders rounded-[20px]">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-text-primary rounded-[12px] flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[18px] font-[400] text-text-primary">
                  {selectedFile.name}
                </p>
                <p className="text-[14px] font-[300] text-text-secondary">
                  {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time Selection */}
        <div className="mb-8">
          <label className="block text-[16px] font-[400] text-text-primary mb-4">
            Link Expiry Time
          </label>
          
          {/* Time Unit Toggle */}
          <div className="flex bg-secondary-bg rounded-[16px] p-1 mb-4">
            <button
              onClick={() => {
                setTimeUnit("minutes");
                setCustomTime(60);
              }}
              className={`flex-1 text-[14px] font-[400] py-2 px-4 rounded-[12px] transition-all duration-300 ${
                timeUnit === "minutes" 
                  ? "bg-neutral-white text-text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Minutes
            </button>
            <button
              onClick={() => {
                setTimeUnit("hours");
                setCustomTime(1);
              }}
              className={`flex-1 text-[14px] font-[400] py-2 px-4 rounded-[12px] transition-all duration-300 ${
                timeUnit === "hours" 
                  ? "bg-neutral-white text-text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hours
            </button>
          </div>

          {/* Time Input */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max={getMaxTime()}
                value={customTime}
                onChange={(e) => setCustomTime(parseInt(e.target.value))}
                className="flex-1 h-2 bg-secondary-bg rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #000000 0%, #000000 ${(customTime / getMaxTime()) * 100}%, #F5F5F5 ${(customTime / getMaxTime()) * 100}%, #F5F5F5 100%)`
                }}
              />
              <span className="text-[16px] font-[400] text-text-primary min-w-[80px] text-right">
                {getTimeDisplay()}
              </span>
            </div>
            
            {/* Quick Time Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {timeUnit === "minutes" ? (
                <>
                  <button
                    onClick={() => setCustomTime(15)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 15 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    15m
                  </button>
                  <button
                    onClick={() => setCustomTime(60)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 60 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    1h
                  </button>
                  <button
                    onClick={() => setCustomTime(180)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 180 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    3h
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCustomTime(1)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 1 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    1h
                  </button>
                  <button
                    onClick={() => setCustomTime(3)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 3 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    3h
                  </button>
                  <button
                    onClick={() => setCustomTime(6)}
                    className={`text-[14px] font-[300] py-2 px-3 rounded-[12px] border transition-all duration-300 ${
                      customTime === 6 
                        ? "border-text-primary bg-text-primary text-neutral-white" 
                        : "border-neutral-borders text-text-secondary hover:border-text-primary hover:text-text-primary"
                    }`}
                  >
                    6h
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Password Protection */}
        <div className="mb-8">
          <label className="block text-[16px] font-[400] text-text-primary mb-3">
            Password Protection (Optional)
          </label>
          <input
            type="password"
            placeholder="Enter password for additional security"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-[16px] font-[300] px-4 py-3 border border-neutral-borders rounded-[16px] bg-neutral-white text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-text-primary focus:border-transparent transition-all duration-300"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-[16px]">
            <p className="text-[14px] font-[300] text-accent-red">{error}</p>
          </div>
        )}

        {/* Generated Link */}
        {shareLink && (
          <div className="mb-8">
            <label className="block text-[16px] font-[400] text-text-primary mb-3">
              Share Link
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 text-[14px] font-[300] px-4 py-3 border border-neutral-borders rounded-[16px] bg-secondary-bg text-text-primary"
              />
              <button
                onClick={handleCopyLink}
                className={`text-[14px] font-[400] px-4 py-3 rounded-[16px] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-text-primary text-neutral-white hover:bg-[#333333]"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[12px] font-[300] text-text-placeholder mt-2">
              Link expires in {getTimeDisplay()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="text-[16px] font-[400] text-text-secondary hover:text-text-primary transition-colors duration-300 px-6 py-3"
          >
            Cancel
          </button>
          {!shareLink && (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="bg-text-primary text-neutral-white text-[16px] font-[400] px-6 py-3 rounded-[20px] transition-all duration-300 hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Generate Link</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
