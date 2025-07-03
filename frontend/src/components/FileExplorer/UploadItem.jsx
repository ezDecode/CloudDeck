import React from "react";
import FileIcon from "./FileIcon";

export default function UploadItem({ fileName, progress }) {
  return (
    <div className="flex items-center p-4 rounded-lg bg-neutral-100 dark:bg-neutral-700 shadow-sm mb-2">
      <FileIcon type="file" size="md" />
      <div className="flex-1 ml-4">
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{fileName}</div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-neutral-200 dark:bg-neutral-600">
            <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{progress}%</div>
    </div>
  );
}
