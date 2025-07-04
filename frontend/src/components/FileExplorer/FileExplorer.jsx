import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from 'sonner';
import { listObjects, getStoredCredentials, uploadFile, downloadFile, deleteObjects, initializeS3Client, clearS3Client } from "../../services/aws/s3Service";
import FileList from "./FileList";
import Breadcrumb from "./Breadcrumb";
import LoadingSpinner from "../common/LoadingSpinner";
import ContextMenu from "./ContextMenu";
import ImagePreview from "./ImagePreview";
import ShareModal from "./ShareModal";
import NewFolderModal from "./NewFolderModal";
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
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const [dragging, setDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModal, setShareModal] = useState({ isOpen: false, file: null });
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemsToDelete: new Set() });
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      initializeS3Client(credentials);
    } catch (initError) {
      toast.error("Failed to initialize S3 client. Please check your credentials.");
      return;
    }

    for (const file of selectedFiles) {
      const key = `${currentPath}${file.name}`;
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));
      const result = await uploadFile(credentials.bucket, key, file, (percentage) => {
        setUploadProgress(prev => ({ ...prev, [key]: percentage }));
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
        toast.error(`Failed to upload ${file.name}`);
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

  const handleDownload = async () => {
    const credentials = getStoredCredentials();
    if (!credentials) {
      toast.error("No credentials found. Please connect to S3 first.");
      return;
    }

    // Initialize S3 client if not already initialized
    try {
      initializeS3Client(credentials);
    } catch (initError) {
      toast.error("Failed to initialize S3 client. Please check your credentials.");
      return;
    }

    for (const key of selectedItems) {
      const result = await downloadFile(credentials.bucket, key);
      if (result.success) {
        const link = document.createElement("a");
        link.href = result.url;
        link.setAttribute("download", key.split("/").pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(`Successfully downloaded ${key.split("/").pop()}`);
      } else {
        toast.error(`Failed to download ${key}`);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    
    setDeleteModal({ 
      isOpen: true, 
      itemsToDelete: new Set(selectedItems) 
    });
  };

  const handleDeleteComplete = () => {
    setSelectedItems(new Set());
    loadFiles();
    toast.success("Files deleted successfully.");
  };

  const handleDisconnect = () => {
    // Clear credentials from localStorage
    localStorage.removeItem("awsCredentials");
    
    // Clear S3 client instance
    clearS3Client();
    
    // Call the onDisconnect callback to update parent component
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setSelectedItems(new Set([item.key]));
    setContextMenu({ show: true, x: e.pageX, y: e.pageY, item });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null });
    setShowFilterMenu(false);
  };

  const handleShare = () => {
    if (contextMenu.item && contextMenu.item.type !== "folder") {
      setShareModal({ isOpen: true, file: contextMenu.item });
      closeContextMenu();
    }
  };

  const handleNewFolder = () => {
    setNewFolderModal(true);
  };

  const handleRename = () => {
    // TODO: Implement rename functionality
    console.log("Rename functionality to be implemented");
    closeContextMenu();
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
    if (item.type === "image") {
      const credentials = getStoredCredentials();
      if (!credentials) {
        toast.error("No credentials found. Please connect to S3 first.");
        return;
      }

      // Initialize S3 client if not already initialized
      try {
        initializeS3Client(credentials);
      } catch (initError) {
        toast.error("Failed to initialize S3 client. Please check your credentials.");
        return;
      }

      const result = await downloadFile(credentials.bucket, item.key);
      if (result.success) {
        setPreviewImage(result.url);
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
        initializeS3Client(credentials);
      } catch (initError) {
        toast.error("Failed to initialize S3 client. Please check your credentials.");
        setLoading(false);
        return;
      }

      const result = await listObjects(credentials.bucket, currentPath);
      
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

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = fileTypeFilter === "all" || file.type === fileTypeFilter;
    return matchesSearch && matchesFilter;
  });
  
  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = fileTypeFilter === "all" || fileTypeFilter === "folder";
    return matchesSearch && matchesFilter;
  });

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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
          <LoadingSpinner size="xl" text="Connecting to your S3 bucket..." />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${dragging ? "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20" : ""} transition-all duration-300`}
      onClick={closeContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toaster 
        richColors 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'linear-gradient(to bottom right, #171717, #262626)',
            color: '#FAFAFA',
            border: '1px solid #404040',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: 'Satoshi, sans-serif',
            fontSize: '14px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          },
          icon: <div style={{ 
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(to top left, #4F46E5, #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ color: '#FFFFFF' }}
            >
              <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>,
          closeButton: true,
          closeButtonProps: {
            style: {
              background: 'transparent',
              border: 'none',
              color: '#A3A3A3',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
            },
          },
        }}
      />
      {/* Navigation Bar */}
      <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo + Title + Breadcrumb */}
          <div className="flex items-center space-x-3 sm:space-x-6 min-w-0 flex-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CloudDeck
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">File Explorer</p>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
            <div className="hidden md:block min-w-0 flex-1">
              <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center space-x-4">
              {/* Action Buttons - Expanded spacing */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleNewFolder}
                  className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm flex items-center space-x-2"
                  title="Create new folder"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium text-sm">New Folder</span>
                </button>
                <button
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm flex items-center space-x-2"
                  title="Upload files"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium text-sm">Upload</span>
                </button>
              </div>

              {/* Control Buttons - Expanded spacing */}
              <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-600 pl-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 flex items-center space-x-2"
                  title="Refresh"
                >
                  <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium text-sm">Refresh</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-red-200 dark:border-red-800 flex items-center space-x-2"
                  title="Disconnect from S3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-sm">Disconnect</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden mt-4 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Mobile Breadcrumb */}
            <div className="mb-4">
              <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={handleNewFolder}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm">New Folder</span>
              </button>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm">Upload</span>
              </button>
            </div>

            {/* Mobile Control Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm">Refresh</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area with better spacing */}
      <div className="flex-1 overflow-hidden relative px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Selection Info */}
        {selectedItems.size > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{selectedItems.size}</span>
              </div>
              <span className="text-blue-800 dark:text-blue-200 font-medium text-sm sm:text-base">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1 sm:flex-none justify-center"
                title="Download selected"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-sm">Download</span>
              </button>
              {selectedItems.size === 1 && (
                <button
                  onClick={() => {
                    const selectedFile = [...files, ...folders].find(item => selectedItems.has(item.key));
                    if (selectedFile && selectedFile.type !== "folder") {
                      setShareModal({ isOpen: true, file: selectedFile });
                    }
                  }}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1 sm:flex-none justify-center"
                  title="Share selected file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm">Share</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1 sm:flex-none justify-center"
                title="Delete selected"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">Delete</span>
              </button>
              {selectedItems.size === files.length + folders.length ? (
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 flex-1 sm:flex-none justify-center"
                  title="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Clear Selection</span>
                </button>
              ) : (
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 flex-1 sm:flex-none justify-center"
                  title="Select all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Select All</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drag and Drop Overlay */}
        {dragging && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-xl m-4 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
              </svg>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Drop files here to upload</p>
              <p className="text-sm text-blue-500 dark:text-blue-300">Release to start uploading</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
              <LoadingSpinner size="xl" text="Loading Files..." />
            </div>
          </div>
        )}
        
        {/* File List Container */}
        <div className="h-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <FileList
            files={filteredFiles}
            folders={filteredFolders}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedItems={selectedItems}
            onNavigateToFolder={navigateToFolder}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            currentPath={currentPath}
            onNavigateUp={navigateUp}
            uploadProgress={uploadProgress}
            onContextMenu={handleContextMenu}
            onPreview={handlePreview}
            onDragDropClick={() => fileInputRef.current && fileInputRef.current.click()}
            onCreateFolderClick={handleNewFolder}
            fileTypeFilter={fileTypeFilter}
            setFileTypeFilter={setFileTypeFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            fileTypeOptions={fileTypeOptions}
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
      
      {/* Modals and Context Menus */}
      <ContextMenu 
        {...contextMenu} 
        onDownload={handleDownload} 
        onDelete={handleDelete} 
        onShare={handleShare}
        onRename={handleRename}
        selectedItem={contextMenu.item}
      />
      {previewImage && <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />}
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
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemsToDelete: new Set() })}
        selectedItems={deleteModal.itemsToDelete}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  );
}
