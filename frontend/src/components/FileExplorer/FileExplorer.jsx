import React, { useState, useEffect, useRef } from "react";
import { listObjects, getStoredCredentials, uploadFile, downloadFile, deleteObjects, initializeS3Client, clearS3Client } from "../../services/aws/s3Service";
import FileList from "./FileList";
import Breadcrumb from "./Breadcrumb";
import LoadingSpinner from "../common/LoadingSpinner";
import ContextMenu from "./ContextMenu";
import ImagePreview from "./ImagePreview";
import ShareModal from "./ShareModal";
import NewFolderModal from "./NewFolderModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function FileExplorer({ onDisconnect }) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

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

    for (const file of selectedFiles) {
      const key = `${currentPath}${file.name}`;
      setUploadProgress(prev => ({ ...prev, [key]: 0 }));
      const result = await uploadFile(credentials.bucket, key, file, (percentage) => {
        setUploadProgress(prev => ({ ...prev, [key]: percentage }));
      });

      if (result.success) {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[key];
          return newProgress;
        });
        loadFiles(); // Refresh file list
      } else {
        setError(`Failed to upload ${file.name}`);
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

    for (const key of selectedItems) {
      const result = await downloadFile(credentials.bucket, key);
      if (result.success) {
        const link = document.createElement("a");
        link.href = result.url;
        link.setAttribute("download", key.split("/").pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        setError(`Failed to download ${key}`);
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

      const result = await downloadFile(credentials.bucket, item.key);
      if (result.success) {
        setPreviewImage(result.url);
      }
    }
  };

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      const credentials = getStoredCredentials();
      if (!credentials) {
        setError("No credentials found. Please connect to S3 first.");
        setLoading(false);
        return;
      }

      // Initialize S3 client if not already initialized
      try {
        initializeS3Client(credentials);
      } catch (initError) {
        setError("Failed to initialize S3 client. Please check your credentials.");
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
        setError(result.message || "Failed to load files");
      }
    } catch (err) {
      setError("Failed to load files. Please check your connection.");
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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
          <div className="relative mb-6">
            <LoadingSpinner size="xl" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Connecting to your S3 bucket...
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we load your files
          </p>
        </div>
      </div>
    );
  }

  if (error && files.length === 0 && folders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Connection Error
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
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
      {/* Navigation Bar */}
      <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo + Title + Breadcrumb */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CloudDeck
              </h1>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
            <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files and folders..."
                className="pl-10 pr-4 py-2.5 w-80 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/70 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 backdrop-blur-sm"
                title="Filter files"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                <span className="text-sm">{fileTypeOptions.find(opt => opt.value === fileTypeFilter)?.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Filter Dropdown */}
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 backdrop-blur-sm">
                  {fileTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFileTypeFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-3 ${
                        fileTypeFilter === option.value ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <span className="text-base">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-600/50"
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === "list" 
                    ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-600/50"
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                  />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewFolder}
                className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                title="Create new folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                title="Upload files"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-600 pl-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600"
                title="Refresh"
              >
                <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-red-200 dark:border-red-800"
                title="Disconnect from S3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area with 10% spacing */}
      <div className="flex-1 overflow-hidden relative px-[10%] py-6">
        {/* Selection Info */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{selectedItems.size}</span>
              </div>
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
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
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                title="Delete selected"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">Delete</span>
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 text-sm"
              >
                Clear
              </button>
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
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto">
                  <svg className="w-16 h-16 animate-spin text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Loading Files...
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Please wait while we refresh your files
              </p>
            </div>
          </div>
        )}
        
        {/* File List Container */}
        <div className="h-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <FileList
            files={filteredFiles}
            folders={filteredFolders}
            viewMode={viewMode}
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
