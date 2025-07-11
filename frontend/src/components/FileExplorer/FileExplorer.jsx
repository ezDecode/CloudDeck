import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from 'sonner';
import { getStoredCredentials, clearStoredCredentials } from "../../utils/authUtils";
import FileList from "./FileList";
import Breadcrumb from "./Breadcrumb";
import LoadingSpinner from "../common/LoadingSpinner";
import MediaPreview from "./MediaPreview";
import ShareModal from "./ShareModal";
import NewFolderModal from "./NewFolderModal";
import RenameModal from "./RenameModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import useSessionTimeout from "../../hooks/useSessionTimeout";

export default function FileExplorer({ onDisconnect }) {
  // Add session timeout hook - will redirect to login after 3 minutes of inactivity
  useSessionTimeout(3);
  
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState("list"); // grid or list
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModal, setShareModal] = useState({ isOpen: false, file: null });
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemsToDelete: new Set() });
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const credentials = getStoredCredentials();
    if (!credentials) {
      toast.error("No credentials found. Please connect to S3 first.");
      return;
    }

    // Initialize S3 client if not already initialized
    try {
      const { initializeS3Client } = await import("../../services/aws/s3Service");
      initializeS3Client(credentials);
    } catch (_error) {
      toast.error("Failed to initialize S3 client. Please check your credentials.");
      return;
    }

    for (const file of selectedFiles) {
      const key = `${currentPath}${file.name}`;
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));
      
      try {
        const { smartUploadFile } = await import("../../services/aws/s3Service");
        const result = await smartUploadFile(credentials.bucketName, key, file, (progressData) => {
          // Handle both old number format and new object format
          setUploadProgress(prev => ({ ...prev, [key]: progressData }));
        });

        if (result.success) {
          toast.success(`Successfully uploaded ${file.name}`);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[key];
            return newProgress;
          });
          loadFiles(); // Refresh file list
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.message || 'Unknown error'}`);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[key];
            return newProgress;
          });
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}: ${error.message || 'Network error'}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[key];
          return newProgress;
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (items = Array.from(selectedItems)) => {
    const credentials = getStoredCredentials();
    if (!credentials) {
      toast.error("No credentials found. Please connect to S3 first.");
      return;
    }

    // Initialize S3 client if not already initialized
    try {
      const { initializeS3Client } = await import("../../services/aws/s3Service");
      initializeS3Client(credentials);
    } catch (_error) {
      toast.error("Failed to initialize S3 client. Please check your credentials.");
      return;
    }

    for (const item of items) {
      const { downloadFile } = await import("../../services/aws/s3Service");
      const result = await downloadFile(credentials.bucketName, item.key);
      if (result.success) {
        window.open(result.url, "_blank");
        toast.success(`Successfully started download for ${item.name}`);
      } else {
        toast.error(`Failed to download ${item.name}`);
      }
    }
  };

  const handleDelete = async (itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) {
      const selectedKeys = Array.from(selectedItems);
      if (selectedKeys.length === 0) return;
      
      const allItems = [...files, ...folders];
      const items = selectedKeys.map(key => allItems.find(item => item.key === key)).filter(Boolean);
      
      setDeleteModal({ 
        isOpen: true, 
        itemsToDelete: new Set(items)
      });
    } else {
      setDeleteModal({ 
        isOpen: true, 
        itemsToDelete: new Set(itemsToDelete) 
      });
    }
  };

  const handleDeleteComplete = (deletedItems) => {
    setSelectedItems(new Set());
    loadFiles();

    const itemCount = deletedItems.size;
    if (itemCount === 0) return;

    const firstItem = deletedItems.values().next().value;
    const isFolder = firstItem.type === 'folder';

    if (itemCount === 1) {
      toast.success(`${isFolder ? 'Folder' : 'File'} deleted successfully.`);
    } else {
      toast.success(`${itemCount} items deleted successfully.`);
    }
  };

  const handleDisconnect = async () => {
    // Clear credentials from localStorage
    clearStoredCredentials();
    
    // Clear S3 client instance
    const { clearS3Client } = await import("../../services/aws/s3Service");
    clearS3Client();
    
    // Call the onDisconnect callback to update parent component
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const handleShare = async (item) => {
    if (item && item.type !== "folder") {
      setShareModal({ isOpen: true, file: item });
    } else if (selectedItems.size === 1) {
      const selectedFile = [...files, ...folders].find(item => selectedItems.has(item.key));
      if (selectedFile && selectedFile.type !== "folder") {
        setShareModal({ isOpen: true, file: selectedFile });
      }
    }
  };

  const handleNewFolder = () => {
    setNewFolderModal(true);
  };

  const handleRename = (item) => {
    if (item) {
      setRenameModal({ isOpen: true, item: item });
    } else if (selectedItems.size === 1) {
      const selectedKey = Array.from(selectedItems)[0];
      const selectedItem = [...files, ...folders].find(item => item.key === selectedKey);
      if (selectedItem) {
        setRenameModal({ isOpen: true, item: selectedItem });
      }
    }
  };

  const handleRenameComplete = () => {
    setSelectedItems(new Set());
    loadFiles();
    setRenameModal({ isOpen: false, item: null });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileChange({ target: { files } });
  };

  const handlePreview = async (item) => {
    if (item.type === "image" || item.type === "video") {
      const credentials = getStoredCredentials();
      if (!credentials) {
        toast.error("No credentials found. Please connect to S3 first.");
        return;
      }

      // Initialize S3 client if not already initialized
      try {
        const { initializeS3Client } = await import("../../services/aws/s3Service");
        initializeS3Client(credentials);
      } catch (_error) {
        toast.error("Failed to initialize S3 client. Please check your credentials.");
        return;
      }

      const { downloadFile } = await import("../../services/aws/s3Service");
      const result = await downloadFile(credentials.bucketName, item.key);
      if (result.success) {
        setPreviewMedia({ src: result.url, type: item.type });
      }
    }
  };

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    
    try {
      const credentials = getStoredCredentials();
      if (!credentials) {
        toast.error("No credentials found. Please connect to S3 first.");
        setLoading(false);
        return;
      }

      // Initialize S3 client if not already initialized
      try {
        const { initializeS3Client } = await import("../../services/aws/s3Service");
        initializeS3Client(credentials);
      } catch (_error) {
        toast.error("Failed to initialize S3 client. Please check your credentials.");
        setLoading(false);
        return;
      }

      const { listObjects } = await import("../../services/aws/s3Service");
      const result = await listObjects(credentials.bucketName, currentPath);
      
      if (result.success) {
        // Process files
        const fileList = result.data.objects
          .filter(obj => !obj.Key.endsWith("/"))
          .map(obj => ({
            key: obj.Key,
            name: obj.Key.split("/").pop(),
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
            type: getFileType(obj.Key),
          }));

        // Process folders
        const folderList = result.data.folders.map(folder => ({
          key: folder.Prefix,
          name: folder.Prefix.slice(currentPath.length).replace(/\/$/, ""),
          type: "folder",
        }));

        setFiles(fileList);
        setFolders(folderList);
      } else {
        toast.error(result.message || "Failed to load files");
      }
    } catch (err) {
      toast.error("Failed to load files. Please check your connection.");
      console.error("Load files error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Load files when component mounts or path changes
  useEffect(() => {
    loadFiles();
  }, [currentPath, loadFiles]);

  const getFileType = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    const typeMap = {
      // Images
      jpg: "image", jpeg: "image", png: "image", gif: "image", 
      bmp: "image", svg: "image", webp: "image",
      // Videos
      mp4: "video", avi: "video", mov: "video", wmv: "video", 
      flv: "video", mkv: "video", webm: "video",
      // Audio
      mp3: "audio", wav: "audio", flac: "audio", aac: "audio", 
      ogg: "audio", wma: "audio",
      // Documents
      pdf: "document", doc: "document", docx: "document", 
      xls: "document", xlsx: "document", ppt: "document", 
      pptx: "document", txt: "document",
      // Code
      js: "code", jsx: "code", ts: "code", tsx: "code", 
      py: "code", java: "code", cpp: "code", c: "code", 
      html: "code", css: "code", json: "code", xml: "code",
      // Archives
      zip: "archive", rar: "archive", tar: "archive", gz: "archive", 
      "7z": "archive", bz2: "archive",
    };
    
    return typeMap[ext] || "file";
  };

  const navigateToFolder = (folderKey) => {
    setCurrentPath(folderKey);
    setSelectedItems(new Set());
  };

  const navigateUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.length > 0 ? parts.join("/") + "/" : "";
    setCurrentPath(newPath);
    setSelectedItems(new Set());
  };

  const handleRefresh = () => {
    loadFiles();
  };

  const handleSelectItem = (key) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === files.length + folders.length) {
      setSelectedItems(new Set());
    } else {
      const allKeys = [...files.map(f => f.key), ...folders.map(f => f.key)];
      setSelectedItems(new Set(allKeys));
    }
  };

  

  const fileTypeOptions = [
    { value: "all", label: "All Files", icon: "📁" },
    { value: "folder", label: "Folders", icon: "📁" },
    { value: "image", label: "Images", icon: "🖼️" },
    { value: "document", label: "Documents", icon: "📄" },
    { value: "video", label: "Videos", icon: "🎬" },
    { value: "audio", label: "Audio", icon: "🎵" },
    { value: "code", label: "Code", icon: "💻" },
    { value: "archive", label: "Archives", icon: "📦" },
    { value: "file", label: "Other", icon: "📎" },
  ];

  if (loading && files.length === 0 && folders.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center px-6 md:px-8">
        <div className="text-center bg-neutral-white border border-neutral-borders rounded-[20px] p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-text-primary rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-neutral-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h2 className="text-[20px] md:text-[24px] font-[400] text-text-primary mb-3 leading-[1.1]">
            Connecting to your S3 bucket...
          </h2>
          <p className="text-[14px] md:text-[16px] font-[300] text-text-secondary">
            Please wait while we load your files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-primary-bg flex flex-col ${dragging ? "ring-2 ring-blue-400 bg-blue-50" : ""} transition-all duration-300`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toaster 
        richColors 
        position="bottom-right"
        toastOptions={{
          className: 'sonner-toast',
          descriptionClassName: 'text-text-secondary',
        }}
      />
      
      {/* Header Section - Aligned with Hero */}
      <div className="px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-text-primary rounded-[16px] flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[24px] md:text-[32px] font-[500] text-text-primary leading-[1.1]">
                  CloudDeck
                </h1>
                <div className="text-[14px] md:text-[16px] font-[300] text-text-secondary mt-1">
                  <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="bg-text-primary text-neutral-white text-[14px] md:text-[16px] font-[400] px-4 md:px-6 py-2 md:py-3 rounded-[20px] border-none cursor-pointer transition-all duration-300 hover:bg-[#333333] transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30"
              >
                Upload Files
              </button>
              
              <button
                onClick={handleNewFolder}
                className="border border-text-primary text-text-primary text-[14px] md:text-[16px] font-[400] px-4 md:px-6 py-2 md:py-3 rounded-[20px] cursor-pointer transition-all duration-300 hover:bg-text-primary hover:text-neutral-white transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30"
              >
                New Folder
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="border border-neutral-borders text-text-secondary text-[14px] md:text-[16px] font-[400] px-4 md:px-6 py-2 md:py-3 rounded-[20px] cursor-pointer transition-all duration-300 hover:bg-secondary-bg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-neutral-borders/30"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              
              <button
                onClick={handleDisconnect}
                className="text-[14px] md:text-[16px] font-[400] text-text-secondary hover:text-text-primary transition-colors duration-300"
              >
                Disconnect
              </button>
            </div>
          </div>

          

        </div>
      </div>

      {/* Main File Area */}
      <div className="flex-1 flex px-6 md:px-8 pb-6 max-w-full mx-auto h-[calc(100vh-200px)] w-full">
        {/* File List */}
        <div className="flex-1">
          <div className="bg-neutral-white border border-neutral-borders rounded-[20px] h-full overflow-hidden">
            <FileList
              files={files}
              folders={folders}
              viewMode={viewMode}
              selectedItems={selectedItems}
              onNavigateToFolder={navigateToFolder}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              currentPath={currentPath}
              onNavigateUp={navigateUp}
              uploadProgress={uploadProgress}
              onPreview={handlePreview}
              onDragDropClick={() => fileInputRef.current && fileInputRef.current.click()}
              onCreateFolderClick={handleNewFolder}
              onDownload={handleDownload}
              onShare={handleShare}
              onRename={handleRename}
              onDelete={handleDelete}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              fileTypeFilter={fileTypeFilter}
              setFileTypeFilter={setFileTypeFilter}
              fileTypeOptions={fileTypeOptions}
            />
          </div>
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-text-primary/10 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center bg-neutral-white border border-neutral-borders rounded-[20px] p-6">
            <div className="w-12 h-12 bg-text-primary rounded-[12px] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-neutral-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[18px] font-[400] text-text-primary mb-2">Drop files here to upload</p>
            <p className="text-[14px] font-[300] text-text-secondary">Release to start uploading</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
      
      {/* Modals and Context Menus */}
      {previewMedia && (
        <MediaPreview
          src={previewMedia.src}
          type={previewMedia.type}
          onClose={() => setPreviewMedia(null)}
        />
      )}
      <ShareModal 
        isOpen={shareModal.isOpen} 
        onClose={() => setShareModal({ isOpen: false, file: null })} 
        selectedFile={shareModal.file} 
      />
      <NewFolderModal 
        isOpen={newFolderModal} 
        onClose={() => setNewFolderModal(false)} 
        currentPath={currentPath}
        onFolderCreated={loadFiles}
      />
      <RenameModal 
        isOpen={renameModal.isOpen} 
        onClose={() => setRenameModal({ isOpen: false, item: null })} 
        selectedItem={renameModal.item}
        currentPath={currentPath}
        onRenameComplete={handleRenameComplete}
      />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemsToDelete: new Set() })}
        selectedItems={deleteModal.itemsToDelete}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  );
}
