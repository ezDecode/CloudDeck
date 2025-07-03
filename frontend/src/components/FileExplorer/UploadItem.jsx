import React from "react";
import FileIcon from "./FileIcon";

export default function UploadItem({ fileName, progress }) {
  const isComplete = progress === 100;
  
  return (
    <div className={`flex items-center p-4 rounded-xl shadow-sm mb-2 transition-all duration-500 transform ${
      isComplete 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 scale-105' 
        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
    }`}>
      <div className={`relative transition-all duration-300 ${isComplete ? 'scale-110' : ''}`}>
        <FileIcon type="file" size="md" />
        {isComplete && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-1 ml-4">
        <div className={`text-sm font-medium truncate transition-colors duration-300 ${
          isComplete 
            ? 'text-green-800 dark:text-green-200' 
            : 'text-blue-800 dark:text-blue-200'
        }`}>
          {fileName}
        </div>
        
        <div className="relative pt-2">
          {/* Background bar */}
          <div className="overflow-hidden h-2 rounded-full bg-slate-200 dark:bg-slate-600">
            {/* Progress bar with smooth animation */}
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                isComplete 
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ 
                width: `${progress}%`,
                transform: `scaleX(${progress / 100})`,
                transformOrigin: 'left',
              }}
            >
              {/* Animated shine effect for ongoing uploads */}
              {!isComplete && (
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Upload speed indicator for active uploads */}
          {!isComplete && progress > 0 && (
            <div className="flex items-center mt-1 space-x-2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">Uploading...</span>
            </div>
          )}
          
          {/* Success message */}
          {isComplete && (
            <div className="flex items-center mt-1 space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Upload complete!</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`text-sm font-medium transition-colors duration-300 ${
        isComplete 
          ? 'text-green-700 dark:text-green-300' 
          : 'text-blue-700 dark:text-blue-300'
      }`}>
        {progress}%
      </div>
    </div>
  );
}
