import React, { useState, useEffect, useRef } from "react";
import { listObjects, getStoredCredentials, uploadFile, downloadFile, deleteObjects } from "../../services/aws/s3Service";
import FileList from "./FileList";
import Breadcrumb from "./Breadcrumb";
import LoadingSpinner from "../common/LoadingSpinner";
import ContextMenu from "./ContextMenu";
import ImagePreview from "./ImagePreview";

export default function FileExplorer() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load files when component mounts or path changes
  useEffect(() => {
    loadFiles();
  }, [currentPath, loadFiles]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const credentials = getStoredCredentials();
    if (!credentials) {
      setError("No credentials found. Please connect to S3 first.");
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
    const credentials = getStoredCredentials();
    if (!credentials) {
      setError("No credentials found. Please connect to S3 first.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      const keys = Array.from(selectedItems);
      const result = await deleteObjects(credentials.bucket, keys);
      if (result.success) {
        setSelectedItems(new Set());
        loadFiles();
      } else {
        setError("Failed to delete items");
      }
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setSelectedItems(new Set([item.key]));
    setContextMenu({ show: true, x: e.pageX, y: e.pageY });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0 });
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

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && files.length === 0 && folders.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && files.length === 0 && folders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-white dark:bg-neutral-800 ${dragging ? "ring-2 ring-primary-400" : ""}`}
      onClick={closeContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* View mode toggle */}
            <div className="flex bg-neutral-200 dark:bg-neutral-700 rounded-md p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-white dark:bg-neutral-800 shadow-sm text-primary dark:text-primary-light" : "text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light"} rounded-md transition-all duration-200`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-white dark:bg-neutral-800 shadow-sm text-primary dark:text-primary-light" : "text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light"} rounded-md transition-all duration-200`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                  />
                </svg>
              </button>
            </div>

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-200"
              title="Upload"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
            <input type="file" id="file-upload" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-200"
              title="Refresh"
              disabled={loading}
            >
              <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Selection info */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
            <span>{selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected</span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDownload}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-200"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors duration-200"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors duration-200"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-neutral-800 bg-opacity-75 flex items-center justify-center z-10">
            <LoadingSpinner />
          </div>
        )}
        
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
        />
      </div>
      <ContextMenu {...contextMenu} onDownload={handleDownload} onDelete={handleDelete} />
      {previewImage && <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
