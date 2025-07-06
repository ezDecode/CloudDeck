import React, { useState } from "react";
import { createFolder } from "../../services/aws/s3Service";
import { getStoredCredentials, initializeS3Client } from "../../services/aws/s3Service";

export default function NewFolderModal({ isOpen, onClose, currentPath, onFolderCreated }) {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError("Please enter a folder name");
      return;
    }

    // Validate folder name
    if (!/^[a-zA-Z0-9._-]+$/.test(folderName)) {
      setError("Folder name can only contain letters, numbers, dots, hyphens, and underscores");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const credentials = getStoredCredentials();
      if (!credentials) {
        setError("No credentials found. Please connect to S3 first.");
        return;
      }

      // Initialize S3 client if not already initialized
      try {
        initializeS3Client(credentials);
      } catch (e) {
        setError("Failed to initialize S3 client. Please check your credentials.");
        return;
      }

      const folderPath = `${currentPath}${folderName}/`;
      const result = await createFolder(credentials.bucketName, folderPath);

      if (result.success) {
        onFolderCreated();
        handleClose();
      } else {
        setError(result.message || "Failed to create folder");
      }
    } catch (err) {
      setError("Failed to create folder");
      console.error("Folder creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName("");
    setError("");
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCreateFolder();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-text-primary bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-white rounded-[24px] shadow-xl max-w-md w-full p-8 transform transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] md:text-[28px] font-[400] text-text-primary">
            Create New Folder
          </h2>
          <button
            onClick={handleClose}
            className="text-text-placeholder hover:text-text-primary transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-[16px] font-[400] text-text-primary mb-3">
            Folder Name
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter folder name..."
            className="w-full text-[16px] font-[300] px-4 py-4 border border-neutral-borders rounded-[16px] bg-neutral-white text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-text-primary focus:border-transparent transition-all duration-300"
            autoFocus
            aria-describedby="folder-name-description"
          />
          <p id="folder-name-description" className="mt-2 text-[14px] font-[300] text-text-secondary">
            Only letters, numbers, dots, hyphens, and underscores are allowed
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-secondary-bg border border-neutral-borders rounded-[16px]">
            <p className="text-[14px] font-[400] text-text-secondary">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="text-[16px] font-[400] text-text-secondary hover:text-text-primary transition-colors duration-300 px-6 py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFolder}
            disabled={loading || !folderName.trim()}
            className="bg-text-primary text-neutral-white text-[16px] font-[400] px-6 py-3 rounded-[20px] transition-all duration-300 hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-neutral-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Folder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
