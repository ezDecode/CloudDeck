import React from "react";
import FileIcon from "./FileIcon";
import { formatFileSize, formatDate } from "../../utils/formatters";

export default function FileItem({
  item,
  isSelected,
  onSelect,
  onNavigate,
  viewMode,
  onContextMenu,
  onPreview,
}) {
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect();
    } else if (item.type === "folder") {
      onNavigate();
    }
  };

  const handleDoubleClick = () => {
    if (item.type === "folder") {
      onNavigate();
    } else {
      onPreview();
    }
  };

  if (viewMode === "list") {
    return (
      <tr
        className={`hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer ${isSelected ? "bg-primary-50 dark:bg-primary-900" : ""}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onContextMenu}
      >
        <td className="p-3">
          <input
            type="checkbox"
            className="rounded-md"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <FileIcon type={item.type} size="sm" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</span>
          </div>
        </td>
        <td className="p-3 text-sm text-neutral-600 dark:text-neutral-400">
          {item.type === "folder" ? "-" : formatFileSize(item.size)}
        </td>
        <td className="p-3 text-sm text-neutral-600 dark:text-neutral-400">
          {item.lastModified ? formatDate(item.lastModified) : "-"}
        </td>
        <td className="p-3">
          <button
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-md"
            title="More actions"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
          >
            <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </td>
      </tr>
    );
  }

  if (viewMode === "mobile-list") {
    return (
      <div
        className={`
          flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
          ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"}
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onContextMenu}
      >
        <input
          type="checkbox"
          className="rounded-md mr-3"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />
        <div className="mr-3">
          <FileIcon type={item.type} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
            <button
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md ml-2"
              title="More actions"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e);
              }}
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{item.type === "folder" ? "Folder" : formatFileSize(item.size)}</span>
            {item.lastModified && (
              <span>{formatDate(item.lastModified)}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`
        flex flex-col items-center p-3 sm:p-4 rounded-lg cursor-pointer transition-colors duration-200
        ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"}
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="relative">
        <FileIcon type={item.type} size="lg" />
        <input
          type="checkbox"
          className="absolute -top-1 -right-1 w-4 h-4 rounded-md"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />
      </div>
      <span className="mt-2 text-xs sm:text-sm text-center truncate w-full text-slate-900 dark:text-slate-100" title={item.name}>
        {item.name}
      </span>
      {item.type !== "folder" && (
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {formatFileSize(item.size)}
        </span>
      )}
    </div>
  );
}
