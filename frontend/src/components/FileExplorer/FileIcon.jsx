import React from "react";

const icons = {
  folder: (size) => (
    <svg className={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" opacity="0.8"/>
      <path d="M20 8H4v10c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V8z" opacity="0.6"/>
    </svg>
  ),
  image: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    </svg>
  ),
  video: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
      />
    </svg>
  ),
  audio: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
      />
    </svg>
  ),
  document: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
  ),
  code: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
      />
    </svg>
  ),
  archive: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" 
      />
    </svg>
  ),
  file: (size) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
      />
    </svg>
  ),
};

const colorClasses = {
  folder: "text-neutral-600",
  image: "text-neutral-600",
  video: "text-neutral-600",
  audio: "text-neutral-600",
  document: "text-neutral-600",
  code: "text-neutral-600",
  archive: "text-neutral-600",
  file: "text-neutral-400",
};

const sizeClasses = {
  sm: "w-5 h-5", // 1.25rem
  md: "w-8 h-8", // 2rem
  lg: "w-12 h-12", // 3rem
  xl: "w-16 h-16", // 4rem
};

export default function FileIcon({ fileName, fileType, size = "md" }) {
  // If fileType is explicitly provided (like "folder"), use it
  // Otherwise, determine type from file extension
  let type;
  if (fileType) {
    type = fileType;
  } else {
    const extension = fileName?.split(".").pop().toLowerCase();
    type = extensionToFileType[extension] || "file";
  }

  const IconComponent = icons[type] || icons.file;
  const colorClass = colorClasses[type] || colorClasses.file;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative ${sizeClass} ${colorClass}`}>
      <IconComponent className="w-full h-full" />
    </div>
  );
}

const extensionToFileType = {
  // Image
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
  svg: "image", bmp: "image", tiff: "image", ico: "image",

  // Video
  mp4: "video", webm: "video", ogg: "video", mov: "video", avi: "video",
  mkv: "video", flv: "video", wmv: "video",

  // Audio
  mp3: "audio", wav: "audio", oga: "audio", aac: "audio", flac: "audio",

  // Document
  pdf: "document", doc: "document", docx: "document", xls: "document",
  xlsx: "document", ppt: "document", pptx: "document", txt: "document",
  rtf: "document",

  // Code
  js: "code", jsx: "code", ts: "code", tsx: "code", html: "code",
  css: "code", json: "code", xml: "code", py: "code", java: "code",
  c: "code", cpp: "code", cs: "code", go: "code", php: "code",
  rb: "code", swift: "code",

  // Archive
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive",
  gz: "archive",
};

const iconMap = {
  folder: (props) => <icons.folder {...props} />,
  image: (props) => <icons.image {...props} />,
  video: (props) => <icons.video {...props} />,
  audio: (props) => <icons.audio {...props} />,
  document: (props) => <icons.document {...props} />,
  code: (props) => <icons.code {...props} />,
  archive: (props) => <icons.archive {...props} />,
  file: (props) => <icons.file {...props} />,
};
