import React from "react";

export default function ContextMenu({ x, y, show, onDownload, onDelete }) {
  if (!show) {
    return null;
  }

  return (
    <div
      className="absolute bg-neutral-100 dark:bg-neutral-700 shadow-lg rounded-md py-2 z-50 border border-neutral-200 dark:border-neutral-600"
      style={{ top: y, left: x }}
    >
      <ul>
        <li>
          <button
            onClick={onDownload}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
          >
            Download
          </button>
        </li>
        <li>
          <button
            onClick={onDelete}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-200"
          >
            Delete
          </button>
        </li>
      </ul>
    </div>
  );
}
