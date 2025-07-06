import CustomDropdown from "../common/CustomDropdown";
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
  onPreview,
  onDragDropClick,
  onCreateFolderClick,
  onDownload,
  onShare,
  onRename,
  onDelete,
  searchTerm,
  setSearchTerm,
  fileTypeFilter,
  setFileTypeFilter,
  fileTypeOptions,
}) {
  const allItems = [...folders, ...files];
  const filteredItems = [...folders, ...files];
  const isEmpty = allItems.length === 0 && Object.keys(uploadProgress).length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-text-secondary p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-secondary-bg rounded-[20px] flex items-center justify-center mb-8 mx-auto">
            <svg className="w-12 h-12 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          
          <h3 className="text-[24px] md:text-[32px] font-[400] text-text-primary mb-4 leading-[1.1]">
            This folder is empty
          </h3>
          
          <p className="text-[16px] md:text-[18px] font-[300] text-text-secondary leading-relaxed mb-8">
            Get started by uploading your files here. You can drag and drop files directly or use the upload button.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onDragDropClick || (() => {})}
              className="bg-text-primary text-neutral-white text-[16px] font-[400] px-6 py-3 rounded-[20px] transition-all duration-300 hover:bg-[#333333] transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30"
            >
              Upload Files
            </button>
            
            <button
              onClick={onCreateFolderClick || (() => {})}
              className="border border-text-primary text-text-primary text-[16px] font-[400] px-6 py-3 rounded-[20px] transition-all duration-300 hover:bg-text-primary hover:text-neutral-white transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30"
            >
              Create Folder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls Bar with Search and Filter */}
      <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-neutral-borders">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full p-2 border border-neutral-borders rounded-lg bg-neutral-white text-text-primary"
            />
          </div>
          {/* Filter Dropdown */}
          <CustomDropdown
            options={fileTypeOptions}
            selectedValue={fileTypeFilter}
            onChange={setFileTypeFilter}
            placeholder="Select a file type"
          />
        </div>

        {/* Context Menu Actions for Selected Items */}
        {selectedItems.size > 0 && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={onSelectAll}
              className="p-1.5 sm:p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-bg rounded-[10px] sm:rounded-[12px] transition-all duration-300"
              title={selectedItems.size === allItems.length ? "Unselect All" : "Select All"}
            >
              Select All
            </button>
            <button
              onClick={onDownload}
              className="p-1.5 sm:p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-bg rounded-[10px] sm:rounded-[12px] transition-all duration-300"
              title="Download"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            {selectedItems.size === 1 && (
              <>
                <button
                  onClick={() => onShare()}
                  className="hidden sm:flex p-1.5 sm:p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-bg rounded-[10px] sm:rounded-[12px] transition-all duration-300"
                  title="Share"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onRename()}
                  className="p-1.5 sm:p-2 text-text-secondary hover:text-text-primary hover:bg-secondary-bg rounded-[10px] sm:rounded-[12px] transition-all duration-300"
                  title="Rename"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </>
            )}
            
            <button
                 onClick={() => onDelete(Array.from(selectedItems))}
                 className="p-1.5 sm:p-2 text-text-secondary hover:bg-secondary-bg rounded-[10px] sm:rounded-[12px] transition-all duration-300"
                 title="Delete"
               >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* File List Content */}
      <div className="h-full overflow-auto">
        <table className="min-w-full divide-y divide-neutral-borders">
          <thead className="bg-secondary-bg sticky top-0 z-10">
            <tr className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <th className="p-3 w-10 text-left"></th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 w-32 text-left">Size</th>
              <th className="p-3 w-40 text-left">Modified</th>
              <th className="p-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-white divide-y divide-neutral-borders">
            {currentPath && (
              <tr
                className="hover:bg-secondary-bg cursor-pointer transition-all duration-200"
                onClick={onNavigateUp}
              >
                <td className="p-3"></td>
                <td className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-bg rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <span className="text-text-primary font-medium">..</span>
                </td>
                <td className="p-3 text-sm text-text-placeholder">-</td>
                <td className="p-3 text-sm text-text-placeholder">-</td>
                <td className="p-3 text-sm text-text-placeholder">-</td>
              </tr>
            )}
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <tr key={key}>
                <td colSpan="5" className="p-3">
                  <UploadItem fileName={key.split("/").pop()} progress={progress} />
                </td>
              </tr>
            ))}
            {filteredItems.map((item) => (
              <FileItem
                key={item.key}
                item={item}
                isSelected={selectedItems.has(item.key)}
                onSelect={() => onSelectItem(item.key)}
                onNavigate={() => item.type === "folder" && onNavigateToFolder(item.key)}
                viewMode="list"
                onPreview={() => onPreview(item)}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
                onRename={onRename}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
