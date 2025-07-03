import React from "react";
import FileItem from "./FileItem";
import UploadItem from "./UploadItem";

export default function FileList({
  files,
  folders,
  viewMode,
  selectedItems,
  onNavigateToFolder,
  onSelectItem,
  onSelectAll,
  currentPath,
  onNavigateUp,
  uploadProgress,
  onContextMenu,
  onPreview,
  onDragDropClick,
  onCreateFolderClick,
}) {
  const allItems = [...folders, ...files];
  const isEmpty = allItems.length === 0 && Object.keys(uploadProgress).length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 dark:text-slate-400 p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner border border-slate-200 dark:border-slate-600">
            <svg className="w-16 h-16 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            This folder is empty
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            Get started by uploading your files here. You can drag and drop files directly or use the upload button above.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onDragDropClick || (() => {})}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium">Upload Files</span>
            </button>
            
            <button
              onClick={onCreateFolderClick || (() => {})}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">Create Folders</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="h-full overflow-hidden">
        <div className="hidden sm:block">
          <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/50 h-full">
            <thead className="bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-sm sticky top-0 z-10">
              <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-4 w-8">
                  <input
                    type="checkbox"
                    className="rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    checked={selectedItems.size === allItems.length}
                    onChange={onSelectAll}
                  />
                </th>
                <th className="p-4">Name</th>
                <th className="p-4 w-32">Size</th>
                <th className="p-4 w-40">Modified</th>
                <th className="p-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm divide-y divide-slate-200/30 dark:divide-slate-700/30 overflow-y-auto">
              {currentPath && (
                <tr
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200"
                  onClick={onNavigateUp}
                >
                  <td className="p-4"></td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">..</span>
                  </td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">-</td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">-</td>
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">-</td>
                </tr>
              )}
              {Object.entries(uploadProgress).map(([key, progress]) => (
                <tr key={key}>
                  <td colSpan="5" className="p-2">
                    <UploadItem fileName={key.split("/").pop()} progress={progress} />
                  </td>
                </tr>
              ))}
              {allItems.map((item) => (
                <FileItem
                  key={item.key}
                  item={item}
                  isSelected={selectedItems.has(item.key)}
                  onSelect={() => onSelectItem(item.key)}
                  onNavigate={() => item.type === "folder" && onNavigateToFolder(item.key)}
                  viewMode="list"
                  onContextMenu={(e) => onContextMenu(e, item)}
                  onPreview={() => onPreview(item)}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile List View */}
        <div className="sm:hidden h-full overflow-auto p-3">
          <div className="space-y-2">
            {currentPath && (
              <div
                className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={onNavigateUp}
              >
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium">..</span>
              </div>
            )}
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <div key={key} className="p-2">
                <UploadItem fileName={key.split("/").pop()} progress={progress} />
              </div>
            ))}
            {allItems.map((item) => (
              <FileItem
                key={item.key}
                item={item}
                isSelected={selectedItems.has(item.key)}
                onSelect={() => onSelectItem(item.key)}
                onNavigate={() => item.type === "folder" && onNavigateToFolder(item.key)}
                viewMode="mobile-list"
                onContextMenu={(e) => onContextMenu(e, item)}
                onPreview={() => onPreview(item)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="h-full overflow-auto p-3 sm:p-4 lg:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
        {currentPath && (
          <div
            className="group flex flex-col items-center p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:shadow-md hover:scale-105 active:scale-95 border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
            onClick={onNavigateUp}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors duration-200">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium truncate w-full text-center">Go Back</span>
          </div>
        )}
        {Object.entries(uploadProgress).map(([key, progress]) => (
          <UploadItem key={key} fileName={key.split("/").pop()} progress={progress} />
        ))}
        {allItems.map((item) => (
          <FileItem
            key={item.key}
            item={item}
            isSelected={selectedItems.has(item.key)}
            onSelect={() => onSelectItem(item.key)}
            onNavigate={() => item.type === "folder" && onNavigateToFolder(item.key)}
            viewMode="grid"
            onContextMenu={(e) => onContextMenu(e, item)}
            onPreview={() => onPreview(item)}
          />
        ))}
      </div>
    </div>
  );
}
