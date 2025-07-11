import React, { useState, useEffect } from "react";
import { getStoredCredentials, initializeS3Client, getS3Client } from "../../services/aws/s3Service";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { toast } from 'sonner';

export default function RenameModal({ isOpen, onClose, selectedItem, currentPath, onRenameComplete }) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && selectedItem) {
      setNewName(selectedItem.name);
      setError("");
    }
  }, [isOpen, selectedItem]);

  const handleRename = async () => {
    if (!newName.trim()) {
      setError("Please enter a name");
      return;
    }

    if (newName === selectedItem.name) {
      handleClose();
      return;
    }

    // Validate name
    if (selectedItem.type === "folder") {
      if (!/^[a-zA-Z0-9._-]+$/.test(newName)) {
        setError("Folder name can only contain letters, numbers, dots, hyphens, and underscores");
        return;
      }
    } else {
      // For files, allow more characters but ensure it has an extension
      if (!/^[a-zA-Z0-9._\s-]+\.[a-zA-Z0-9]+$/.test(newName)) {
        setError("Please provide a valid file name with extension");
        return;
      }
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
      } catch (initError) {
        setError("Failed to initialize S3 client. Please check your credentials.");
        return;
      }

      // For AWS S3, we need to copy the object to a new key and delete the old one
      const oldKey = selectedItem.key;
      const newKey = `${currentPath}${newName}`;

      
      
      const s3Client = getS3Client();

      // Copy object to new location
      const copyCommand = new CopyObjectCommand({
        Bucket: credentials.bucketName,
        CopySource: `${credentials.bucketName}/${oldKey}`,
        Key: newKey,
      });

      await s3Client.send(copyCommand);

      // Delete the old object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: credentials.bucketName,
        Key: oldKey,
      });

      await s3Client.send(deleteCommand);

      toast.success(`Successfully renamed ${selectedItem.type === "folder" ? "folder" : "file"}`);
      onRenameComplete();
      handleClose();
    } catch (err) {
      console.error("Rename error:", err);
      setError(`Failed to rename ${selectedItem.type === "folder" ? "folder" : "file"}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewName("");
    setError("");
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRename();
    }
  };

  if (!isOpen || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-white border border-neutral-borders rounded-[20px] shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-[500] text-text-primary">
            Rename {selectedItem.type === "folder" ? "Folder" : "File"}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-placeholder hover:text-text-secondary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-[14px] font-[400] text-text-secondary mb-2">
            {selectedItem.type === "folder" ? "Folder Name" : "File Name"}
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Enter ${selectedItem.type === "folder" ? "folder" : "file"} name...`}
            className="w-full px-3 py-3 border border-neutral-borders rounded-[16px] bg-neutral-white text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-text-primary focus:border-transparent transition-all duration-300"
            autoFocus
          />
          <p className="mt-1 text-[12px] text-text-placeholder">
            {selectedItem.type === "folder" 
              ? "Only letters, numbers, dots, hyphens, and underscores are allowed" 
              : "Include the file extension (e.g., .jpg, .pdf, .txt)"
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-secondary-bg border border-neutral-borders rounded-[16px]">
            <p className="text-[14px] text-text-secondary">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="text-[14px] font-[400] text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={loading || !newName.trim()}
            className="bg-text-primary text-neutral-white text-[14px] font-[400] px-6 py-2 rounded-[16px] transition-all duration-300 hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Renaming...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
