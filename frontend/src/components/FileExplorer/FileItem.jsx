import React, { useState, useRef, useEffect } from "react";
import FileIcon from "./FileIcon";
import { formatFileSize, formatDate } from "../../utils/formatters";

// Helper function to determine if a file is an image or video
const isImageOrVideo = (fileName) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];
  const extension = fileName.split(".").pop().toLowerCase();
  return imageExtensions.includes(extension) || videoExtensions.includes(extension);
};

export default function FileItem({
  item,
  isSelected,
  onSelect,
  onNavigate,
  viewMode,
  onPreview,
  onDownload,
  onShare,
  onDelete,
  onRename,
}) {
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect();
    } else if (item.type !== "folder") {
      // For files, a single click can also trigger selection
      onSelect();
    }
  };

  const handleDoubleClick = () => {
    if (item.type === "folder") {
      onNavigate();
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  useEffect(() => {
    if (showMenu) {
      document.addEventListener("click", handleCloseMenu);
    } else {
      document.removeEventListener("click", handleCloseMenu);
    }
    return () => {
      document.removeEventListener("click", handleCloseMenu);
    };
  }, [showMenu]);

  if (viewMode === "list") {
    const isPreviewable = item.type !== "folder" && isImageOrVideo(item.name);
    return (
      <tr
        className={`hover:bg-secondary-bg cursor-pointer ${isSelected ? "bg-blue-50 ring-2 ring-blue-400" : ""}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <td className="p-3">
          {item.type !== "folder" && (
            <input
              type="checkbox"
              className="rounded-md"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            />
          )}
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <FileIcon fileName={item.name} fileType={item.type} size="sm" />
            <span className="font-regular text-text-primary">
              {item.name}
            </span>
            {isPreviewable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(item);
                }}
                className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-600"
                title="Preview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </td>
        <td className="p-3 text-sm text-text-secondary">
          {item.type === "folder" ? "-" : formatFileSize(item.size)}
        </td>
        <td className="p-3 text-sm text-text-secondary">
          {item.lastModified ? formatDate(item.lastModified) : "-"}
        </td>
        <td className="p-3 relative text-center">
          <button
            onClick={handleMenuToggle}
            className={`p-2 rounded-full transition-colors duration-200 ${showMenu ? 'bg-neutral-borders' : 'hover:bg-secondary-bg'} text-text-primary`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-48 bg-[#E0E0E0] border border-neutral-borders rounded-lg shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="py-1">
                <li
                  className="px-4 py-2 hover:bg-neutral-borders cursor-pointer text-sm text-text-primary"
                  onClick={() => {
                    onDownload([item]);
                    handleCloseMenu();
                  }}
                >
                  Download
                </li>
                {item.type !== "folder" && (
                  <li
                    className="px-4 py-2 hover:bg-neutral-borders cursor-pointer text-sm text-text-primary"
                    onClick={() => {
                      onShare(item);
                      handleCloseMenu();
                    }}
                  >
                    Share
                  </li>
                )}
                <li
                  className="px-4 py-2 hover:bg-neutral-borders cursor-pointer text-sm text-text-primary"
                  onClick={() => {
                    onRename(item);
                    handleCloseMenu();
                  }}
                >
                  Rename
                </li>
                <li
                  className="px-4 py-2 hover:bg-secondary-bg cursor-pointer text-sm text-text-secondary"
                  onClick={() => {
                    onDelete([item]);
                    handleCloseMenu();
                  }}
                >
                  Delete
                </li>
              </ul>
            </div>
          )}
        </td>
      </tr>
    );
  }
}
