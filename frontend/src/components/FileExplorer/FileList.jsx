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
}) {
  const allItems = [...folders, ...files];
  const isEmpty = allItems.length === 0 && Object.keys(uploadProgress).length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
        <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="text-xl font-semibold">This folder is empty</p>
        <p className="text-md mt-2">Upload files to get started</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-700">
            <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  className="rounded-md border-neutral-300 dark:border-neutral-600 text-primary focus:ring-primary"
                  checked={selectedItems.size === allItems.length}
                  onChange={onSelectAll}
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3 w-32">Size</th>
              <th className="p-3 w-40">Modified</th>
              <th className="p-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
            {currentPath && (
              <tr
                className="hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                onClick={onNavigateUp}
              >
                <td className="p-3"></td>
                <td className="p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-neutral-600 dark:text-neutral-300">..</span>
                </td>
                <td className="p-3 text-sm text-neutral-600 dark:text-neutral-400">-</td>
                <td className="p-3 text-sm text-neutral-600 dark:text-neutral-400">-</td>
                <td className="p-3 text-sm text-neutral-600 dark:text-neutral-400">-</td>
              </tr>
            )}
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <tr key={key}>
                <td colSpan="5">
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
    );
  }

  // Grid view
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {currentPath && (
          <div
            className="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={onNavigateUp}
          >
            <svg className="w-12 h-12 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm text-neutral-600 dark:text-neutral-300 truncate w-full text-center">..</span>
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
