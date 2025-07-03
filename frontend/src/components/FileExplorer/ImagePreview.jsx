import React from "react";

export default function ImagePreview({ src, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="max-w-4xl max-h-4xl bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-xl transform transition-transform duration-300 scale-95 opacity-0 animate-scale-in" onClick={e => e.stopPropagation()}>
        <img src={src} alt="Preview" className="max-w-full max-h-full object-contain" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white dark:text-neutral-200 bg-black bg-opacity-50 dark:bg-neutral-700 rounded-full p-2 hover:bg-opacity-75 dark:hover:bg-neutral-600 transition-colors duration-200"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
