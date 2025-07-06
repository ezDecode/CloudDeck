import React, { useState } from "react";
import { getStoredCredentials } from "../../utils/authUtils";

export default function DeleteConfirmModal({ isOpen, onClose, selectedItems, onDeleteComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
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
        const { initializeS3Client } = await import("../../services/aws/s3Service");
        initializeS3Client(credentials);
      } catch (_error) {
        setError("Failed to initialize S3 client. Please check your credentials.");
        return;
      }

      const { deleteObjects } = await import("../../services/aws/s3Service");
      const keys = Array.from(selectedItems).map(item => item.key);
      const result = await deleteObjects(credentials.bucketName, keys);
      
      if (result.success) {
        onDeleteComplete(selectedItems);
        handleClose();
      } else {
        setError(result.message || "Failed to delete items");
      }
    } catch (err) {
      setError("Failed to delete items");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const itemCount = selectedItems.size;
  const itemText = itemCount === 1 ? "item" : "items";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center">
            <div className="w-10 h-10 bg-secondary-bg rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            Delete {itemText}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-placeholder hover:text-text-secondary transition-colors p-2 hover:bg-secondary-bg rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 p-4 bg-secondary-bg rounded-lg border border-neutral-borders">
            <svg className="w-8 h-8 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-text-primary font-medium">
                Are you sure you want to delete {itemCount} {itemText}?
              </p>
              <p className="text-text-secondary text-sm mt-1">
                This action cannot be undone. The {itemText} will be permanently removed from your S3 bucket.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-secondary-bg border border-neutral-borders rounded-lg">
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            autoFocus
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 bg-text-primary hover:bg-text-secondary disabled:bg-text-placeholder text-neutral-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete {itemText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}